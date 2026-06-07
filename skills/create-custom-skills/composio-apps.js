'use strict'
// composio-apps.js — Dynamic detection of the Composio apps THIS workspace has
// actually connected. Shared by scan.js (1:1 draft scanner) and
// propose-skills.js (composite proposal engine) so both reason about the same
// real, per-workspace tool set instead of a hardcoded list.
//
// Mechanism (real, portable, key-only):
//   Duet proxies Composio tool execution at
//     POST {APP_URL}/api/v1/composio/execute/{TOOL_SLUG}
//   authenticated with DUET_API_KEY (the org key, injected server-side). We call
//   COMPOSIO_CHECK_ACTIVE_CONNECTION once per CANDIDATE toolkit; it returns
//   { data: { active_connection: bool, connection_details } } deterministically.
//   We keep the toolkits that report active_connection:true. This works for ANY
//   workspace with just DUET_API_KEY — no MCP/session context required.
//
// Composio has hundreds of toolkits and the proxy has no "list all connections"
// tool, so we probe a curated CANDIDATE registry of the common ones. The set is
// extendable/overridable via the COMPOSIO_TOOLKITS env var (comma-separated
// slugs) so a workspace with an exotic integration is still covered.
//
// Degradation: if DUET_API_KEY is missing or every probe errors (network/proxy
// down), we fall back to DEFAULT_APPS and SAY SO via the returned `note`.

const APP_BASE = process.env.DUET_APP_BASE_URL || process.env.APP_URL || 'https://duet.so'
const API_KEY = process.env.DUET_API_KEY
const PROBE_CONCURRENCY = 10
const PROBE_TIMEOUT_MS = 12000

// Curated metadata for well-known toolkits — used to write a useful draft
// SKILL.md when the toolkit is detected as connected. Anything detected but not
// in this map gets generic metadata (see metaFor).
const TOOLKIT_META = {
  gmail: {
    name: 'Gmail Triage Draft',
    description:
      'Draft skill for Gmail. Read, label, search, and send email via the connected Gmail account. Use to triage the inbox, draft replies, or pull message context into a workflow.',
  },
  slack: {
    name: 'Slack Messaging Draft',
    description:
      'Draft skill for Slack. Post messages, search channels, and read threads via the connected Slack workspace. Use to broadcast updates or pull conversation context.',
  },
  stripe: {
    name: 'Stripe Billing Draft',
    description:
      'Draft skill for Stripe. Query customers, subscriptions, invoices, and payments via the connected Stripe account. Use for billing lookups and revenue reporting.',
  },
  google_search_console: {
    name: 'Google Search Console Draft',
    description:
      'Draft skill for Google Search Console. Pull search performance, top queries, and indexed pages via the connected GSC property. Use for SEO/AEO reporting.',
  },
  googlecalendar: {
    name: 'Google Calendar Draft',
    description:
      'Draft skill for Google Calendar. List events, check availability, and create invites via the connected calendar. Use for scheduling and availability lookups.',
  },
  googledrive: {
    name: 'Google Drive Draft',
    description:
      'Draft skill for Google Drive. Search, read, and manage files/folders via the connected Drive. Use to pull documents into a workflow or file generated artifacts.',
  },
  googlesheets: {
    name: 'Google Sheets Draft',
    description:
      'Draft skill for Google Sheets. Read and write spreadsheet rows via the connected account. Use for lightweight data tracking and reporting.',
  },
  googledocs: {
    name: 'Google Docs Draft',
    description:
      'Draft skill for Google Docs. Create and edit documents via the connected account. Use to generate briefs, reports, and shareable write-ups.',
  },
  outlook: {
    name: 'Outlook Mail Draft',
    description:
      'Draft skill for Outlook. Read, search, and send mail via the connected Microsoft account. Use to triage the inbox or draft replies.',
  },
  github: {
    name: 'GitHub Draft',
    description:
      'Draft skill for GitHub. Query issues, PRs, and repositories via the connected account. Use for engineering status, triage, and release reporting.',
  },
  linear: {
    name: 'Linear Draft',
    description:
      'Draft skill for Linear. Query and update issues, projects, and cycles via the connected workspace. Use for engineering planning and status.',
  },
  jira: {
    name: 'Jira Draft',
    description:
      'Draft skill for Jira. Query and update issues and sprints via the connected project. Use for engineering/PM tracking.',
  },
  notion: {
    name: 'Notion Draft',
    description:
      'Draft skill for Notion. Search, read, and write pages and databases via the connected workspace. Use as a knowledge base or doc store in a workflow.',
  },
  hubspot: {
    name: 'HubSpot CRM Draft',
    description:
      'Draft skill for HubSpot. Query and update contacts, companies, and deals via the connected CRM. Use for pipeline lookups and CRM hygiene.',
  },
  salesforce: {
    name: 'Salesforce Draft',
    description:
      'Draft skill for Salesforce. Query and update CRM objects via the connected org. Use for pipeline reporting and record updates.',
  },
  attio: {
    name: 'Attio CRM Draft',
    description:
      'Draft skill for Attio. Query and update records, lists, and notes via the connected CRM. Use for pipeline tracking and contact enrichment.',
  },
  airtable: {
    name: 'Airtable Draft',
    description:
      'Draft skill for Airtable. Read and write base records via the connected account. Use for structured tracking and lightweight apps.',
  },
  zendesk: {
    name: 'Zendesk Draft',
    description:
      'Draft skill for Zendesk. Query and update support tickets via the connected account. Use for support triage and reporting.',
  },
  intercom: {
    name: 'Intercom Draft',
    description:
      'Draft skill for Intercom. Read conversations and contacts via the connected workspace. Use for support and customer-context workflows.',
  },
  discord: {
    name: 'Discord Draft',
    description:
      'Draft skill for Discord. Post messages and read channels via the connected server. Use to broadcast updates or pull community context.',
  },
  telegram: {
    name: 'Telegram Draft',
    description:
      'Draft skill for Telegram. Send messages and read chats via the connected bot. Use for notifications and lightweight messaging.',
  },
  twitter: {
    name: 'Twitter/X Draft',
    description:
      'Draft skill for Twitter/X. Read and post via the connected account. Use for social listening and publishing.',
  },
  notiondb: {
    name: 'Notion Database Draft',
    description: 'Draft skill for a connected Notion database. Use for structured tracking.',
  },
  asana: {
    name: 'Asana Draft',
    description:
      'Draft skill for Asana. Query and update tasks and projects via the connected workspace. Use for project tracking.',
  },
  trello: {
    name: 'Trello Draft',
    description:
      'Draft skill for Trello. Read and update boards and cards via the connected account. Use for lightweight project tracking.',
  },
  calendly: {
    name: 'Calendly Draft',
    description:
      'Draft skill for Calendly. Read scheduled events and availability via the connected account. Use for scheduling workflows.',
  },
}

// The default candidate set we probe for an active connection. Broad enough to
// cover most workspaces; extend/override with COMPOSIO_TOOLKITS.
const CANDIDATE_TOOLKITS = [
  'gmail', 'slack', 'stripe', 'google_search_console',
  'googlecalendar', 'googledrive', 'googlesheets', 'googledocs',
  'outlook', 'github', 'linear', 'jira', 'notion',
  'hubspot', 'salesforce', 'attio', 'airtable',
  'zendesk', 'intercom', 'discord', 'telegram', 'twitter',
  'asana', 'trello', 'calendly',
]

// The documented fallback when dynamic detection is unavailable. These are the
// four apps the original skill shipped with.
const DEFAULT_APP_SLUGS = ['gmail', 'slack', 'stripe', 'google_search_console']

function titleCase(slug) {
  return String(slug || '')
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function metaFor(slug) {
  const known = TOOLKIT_META[slug]
  if (known) return { app: slug, name: known.name, description: known.description }
  const label = titleCase(slug)
  return {
    app: slug,
    name: `${label} Draft`,
    description: `Draft skill for the connected ${label} Composio app. Flesh out the concrete operations, inputs, and example invocations before publishing.`,
  }
}

function candidateSlugs() {
  const fromEnv = String(process.env.COMPOSIO_TOOLKITS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  // Env REPLACES the candidate set when provided, else use the curated default.
  const base = fromEnv.length ? fromEnv : CANDIDATE_TOOLKITS.slice()
  return Array.from(new Set(base))
}

async function checkActiveConnection(toolkit) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
  try {
    const res = await fetch(`${APP_BASE}/api/v1/composio/execute/COMPOSIO_CHECK_ACTIVE_CONNECTION`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ arguments: { toolkit } }),
      signal: controller.signal,
    })
    if (!res.ok) return { toolkit, active: false, error: `http ${res.status}` }
    const json = await res.json()
    const active = !!(json && json.data && json.data.active_connection)
    return { toolkit, active }
  } catch (e) {
    return { toolkit, active: false, error: e.message }
  } finally {
    clearTimeout(t)
  }
}

async function runPool(items, worker, concurrency) {
  let i = 0
  const out = []
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++
      out[idx] = await worker(items[idx])
    }
  })
  await Promise.all(runners)
  return out
}

// Detect the connected Composio apps for this workspace.
// Returns { apps: [{app,name,description}], source: 'dynamic'|'fallback', note, probed, errors }.
// Cached for the lifetime of the process (set `force` to re-probe).
let _cache = null
async function detectConnectedApps({ force = false } = {}) {
  if (_cache && !force) return _cache

  if (!API_KEY) {
    _cache = {
      apps: DEFAULT_APP_SLUGS.map(metaFor),
      source: 'fallback',
      note: 'DUET_API_KEY not set — using documented default app list (gmail, slack, stripe, google_search_console).',
      probed: 0,
      errors: 0,
    }
    return _cache
  }

  const slugs = candidateSlugs()
  const results = await runPool(slugs, checkActiveConnection, PROBE_CONCURRENCY)
  const errors = results.filter((r) => r.error).length

  // If literally every probe errored, the proxy is unreachable -> fall back.
  if (errors === results.length) {
    _cache = {
      apps: DEFAULT_APP_SLUGS.map(metaFor),
      source: 'fallback',
      note: `Composio proxy unreachable (${results[0] && results[0].error}) — using documented default app list.`,
      probed: results.length,
      errors,
    }
    return _cache
  }

  const active = results.filter((r) => r.active).map((r) => metaFor(r.toolkit))
  active.sort((a, b) => a.app.localeCompare(b.app))
  _cache = {
    apps: active,
    source: 'dynamic',
    note: `Probed ${results.length} candidate toolkits via COMPOSIO_CHECK_ACTIVE_CONNECTION; ${active.length} active${errors ? `, ${errors} probe errors` : ''}.`,
    probed: results.length,
    errors,
  }
  return _cache
}

module.exports = {
  detectConnectedApps,
  CANDIDATE_TOOLKITS,
  DEFAULT_APP_SLUGS,
  TOOLKIT_META,
  metaFor,
  candidateSlugs,
}

if (require.main === module) {
  detectConnectedApps()
    .then((r) => {
      console.log(`[composio-apps] source=${r.source} probed=${r.probed} errors=${r.errors}`)
      console.log(`[composio-apps] ${r.note}`)
      for (const a of r.apps) console.log(`  • ${a.app} — ${a.name}`)
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
