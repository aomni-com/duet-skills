'use strict'
// propose-skills.js — Permutation-based composite skill-proposal engine.
//
// PHASE 1 scope (Ani): mine CONVERSATIONS + TOOLS only (files come later) and
// propose a TIGHT, HIGH-CONFIDENCE set of ~5-8 COMPOSITE skills — real recurring
// jobs for THIS workspace, each composed of MULTIPLE tools/skills where it makes
// sense (many-to-many, NOT one-skill-per-tool).
//
// Pipeline:
//   A. Inventory building blocks  -> connected Composio apps + installed skills
//   B. Mine conversations         -> recurring jobs-to-be-done from real channels
//   C. LLM synthesis              -> STRICT-JSON composite proposals (grounded)
//   D. Emit idempotent drafts     -> lib.addEntry(source:`proposed:<slug>`)
//   E. (caller) re-enrich pills
//
// Idempotent: a proposal whose `proposed:<slug>` source already exists is
// skipped, so re-runs create 0 new drafts. Degrades gracefully: if the Duet
// API is unreachable / empty, it proceeds tools-only and SAYS SO (never
// fabricates conversation evidence).
//
// Run standalone:  node propose-skills.js
//   --no-ai    skip the LLM synthesis step (inventory + mine only; emit nothing)
//   --dry      run the full pipeline but do NOT write drafts
//   --refresh  force a fresh synthesis even if proposals already exist
//
// True idempotency: the LLM is non-deterministic, so re-synthesis can phrase
// the same job with a slightly different slug — dedup-by-slug alone would leak
// near-duplicate drafts on every run. So the engine PROPOSES ONCE: if any
// `proposed:` draft already exists it short-circuits (skips the LLM + emit and
// reports 0 created) unless --refresh is passed. The user prunes the set; a
// re-run never adds noise.

const fs = require('fs')
const os = require('os')
const path = require('path')
const lib = require('./lib.js')
const { detectConnectedApps } = require('./composio-apps.js')

// --- Config ------------------------------------------------------------------
const DUET_API = 'https://duet.so/api/v1'
const GATEWAY_URL = 'https://duet.so/api/v1/ai-gateway/v1/chat/completions'
// Synthesis quality matters here, so default to a stronger model than enrich's
// gpt-4.1-mini. Override with PROPOSE_MODEL.
const MODEL = process.env.PROPOSE_MODEL || 'openai/gpt-4.1'
const API_KEY = process.env.DUET_API_KEY

// Mining bounds — keep total text fed to the LLM well under ~100k chars.
const MAX_CHANNELS = 8 // most-active public channels to mine
const MSGS_PER_CHANNEL = 60 // most recent messages per channel
const MAX_TOTAL_MSGS = 360 // hard cap across all channels
const MSG_CHAR_CAP = 320 // truncate any single message snippet
const TOTAL_CHAR_CAP = 90000 // hard cap on the mined transcript handed to the LLM
const PROPOSAL_MIN = 5
const PROPOSAL_MAX = 8

// Channels that are noise for "what recurring jobs does this team ask for" —
// bot output streams, kanban board shells, and one-off scratch channels.
const SKIP_CHANNEL_NAME = /^(Disk Usage|Image Content|Friendly greeting|Video Pipeline Board|SEO\/AEO Content Board)/i

// --- small helpers -----------------------------------------------------------
function slugify(name) {
  return String(name || 'skill')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'skill'
}

function parseJsonLoose(text) {
  if (!text) return null
  let t = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
  try { return JSON.parse(t) } catch {}
  const start = t.search(/[[{]/)
  if (start === -1) return null
  const open = t[start]
  const close = open === '[' ? ']' : '}'
  const end = t.lastIndexOf(close)
  if (end > start) { try { return JSON.parse(t.slice(start, end + 1)) } catch {} }
  return null
}

async function duetGet(pathAndQuery) {
  const res = await fetch(`${DUET_API}${pathAndQuery}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  })
  if (!res.ok) throw new Error(`duet ${res.status}: ${(await res.text()).slice(0, 160)}`)
  const json = await res.json()
  return json.data
}

// --- Step A: inventory the building blocks -----------------------------------
async function inventory() {
  // Connected Composio apps — detected DYNAMICALLY (composio-apps.js) so we
  // never hallucinate tools that aren't connected for THIS workspace.
  const detected = await detectConnectedApps()
  const connectedApps = detected.apps.map((a) => a.app)

  // Installed skills as composable building blocks: read names + descriptions
  // from the library index (seeded from ~/.agents + ~/.duet skills).
  const index = lib.readIndex()
  const installedSkills = (index.skills || [])
    .filter((s) => String(s.source || '').startsWith('installed:'))
    .map((s) => ({ name: s.name, description: String(s.description || '').slice(0, 220) }))

  return { connectedApps, installedSkills, index, appsDetection: detected }
}

// --- Step B: mine conversations ----------------------------------------------
function messageText(m) {
  const parts = Array.isArray(m.parts) ? m.parts : []
  return parts
    .filter((p) => p && p.type === 'text' && p.text)
    .map((p) => p.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function authorName(m) {
  if (m.origin === 'ai') return 'Duet'
  const u = m.user || {}
  return u.firstName || u.email || 'user'
}

async function mineConversations() {
  const result = { available: false, channelsMined: [], messageCount: 0, transcript: '', note: '' }
  if (!API_KEY) {
    result.note = 'DUET_API_KEY not set — degraded to tools-only.'
    return result
  }
  let channels
  try {
    channels = await duetGet('/channels?limit=60&sort=desc')
  } catch (e) {
    result.note = `Duet channels API unreachable (${e.message}) — degraded to tools-only.`
    return result
  }
  if (!Array.isArray(channels) || channels.length === 0) {
    result.note = 'Duet API returned no channels — degraded to tools-only.'
    return result
  }

  // Rank public channels by activity (lastMessageIndex), drop noise/shells.
  const ranked = channels
    .map((c) => c.channel || c)
    .filter((c) => c && (c.type === 'channel:public' || c.type === 'external:public'))
    .filter((c) => !c.isArchived && !SKIP_CHANNEL_NAME.test(c.name || ''))
    .filter((c) => Number(c.lastMessageIndex || 0) >= 5)
    .sort((a, b) => Number(b.lastMessageIndex || 0) - Number(a.lastMessageIndex || 0))
    .slice(0, MAX_CHANNELS)

  const blocks = []
  let total = 0
  let chars = 0
  for (const c of ranked) {
    if (total >= MAX_TOTAL_MSGS || chars >= TOTAL_CHAR_CAP) break
    let msgs
    try {
      msgs = await duetGet(`/channels/${c._id}/messages?limit=${MSGS_PER_CHANNEL}&order=desc`)
    } catch {
      continue
    }
    if (!Array.isArray(msgs) || msgs.length === 0) continue
    // Oldest-first within the slice for readability.
    msgs = msgs.filter((m) => m.status === 'completed').reverse()
    const lines = []
    for (const m of msgs) {
      if (total >= MAX_TOTAL_MSGS || chars >= TOTAL_CHAR_CAP) break
      const text = messageText(m)
      if (!text) continue
      // Skip trivial chatter; keep substantive asks/answers.
      if (text.length < 12) continue
      const snippet = text.length > MSG_CHAR_CAP ? text.slice(0, MSG_CHAR_CAP) + '…' : text
      const line = `${authorName(m)}: ${snippet}`
      lines.push(line)
      total++
      chars += line.length
    }
    if (lines.length) {
      blocks.push(`## #${c.name} (${lines.length} msgs)\n${lines.join('\n')}`)
      result.channelsMined.push({ name: c.name, msgs: lines.length })
    }
  }

  result.available = blocks.length > 0
  result.messageCount = total
  result.transcript = blocks.join('\n\n')
  if (!result.available) result.note = 'No substantive messages mined — degraded to tools-only.'
  return result
}

// --- Step C: LLM synthesis ---------------------------------------------------
async function callGateway(messages) {
  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, temperature: 0.2, messages }),
  })
  if (!res.ok) throw new Error(`gateway ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

const SYNTH_SYSTEM = `You are a senior automation architect proposing COMPOSITE agent skills for a specific team's workspace.
A composite skill is a real RECURRING JOB this team does, automated end-to-end by CHAINING multiple tools and/or existing skills (many-to-many). It is NOT a 1:1 wrapper around a single tool.
Rules:
- Propose ONLY high-confidence skills grounded in REAL signal: a recurring conversation pattern AND/OR the available tools/skills. Cite the signal in "rationale".
- NEVER propose a skill that needs a tool that is not in the provided connected-tools list.
- Prefer skills that combine 2+ capabilities (e.g. data source -> synthesis -> delivery).
- Each proposal's "tools" array may ONLY contain values from the connected-tools list. "composes" may ONLY contain names from the installed-skills list.
- Return STRICT JSON ONLY: an array of objects. No prose, no markdown fences.`

function buildSynthUser({ connectedApps, installedSkills }, mining) {
  const skillList = installedSkills
    .map((s) => `- ${s.name}: ${s.description}`)
    .join('\n')
  const convoSection = mining.available
    ? `RECURRING-JOB SIGNAL — real recent messages from this workspace's most active channels (mine these for jobs people repeatedly ask for, especially asks directed at the AI/Duet):\n\n${mining.transcript}`
    : `NO CONVERSATION SIGNAL AVAILABLE (${mining.note}). Propose ONLY from the connected tools + installed skills below, and lower your confidence accordingly. Do NOT invent conversation evidence.`

  return `CONNECTED TOOLS (Composio apps actually connected for this workspace — the ONLY external tools you may reference):
${connectedApps.map((a) => `- ${a}`).join('\n')}

INSTALLED SKILLS (composable building blocks a composite skill can chain):
${skillList}

${convoSection}

TASK: Propose a TIGHT set of ${PROPOSAL_MIN}-${PROPOSAL_MAX} HIGH-CONFIDENCE composite skills for THIS workspace.
Each must be a genuine recurring job, composed of multiple tools/skills where appropriate. Rank by confidence; keep only the strongest ${PROPOSAL_MIN}-${PROPOSAL_MAX}.

Return STRICT JSON: an array of objects with EXACTLY these fields:
{
  "name": "Human Title Case Name",
  "slug": "kebab-case-slug",
  "job": "one-line concrete outcome",
  "tools": ["only", "from", "connected", "tools"],
  "composes": ["Installed Skill Name", "..."],
  "trigger": "when this should fire / how invoked",
  "confidence": 0.0,
  "rationale": "cite the conversation pattern and/or tool signal that grounds this",
  "skillMd": "a COMPLETE SKILL.md body: YAML frontmatter with name+description, then ## Trigger, ## What it does, ## Steps (numbered, naming the tools/skills it chains), and ## Status: draft"
}`
}

function sanitizeProposals(raw, connectedApps, installedSkills) {
  if (!Array.isArray(raw)) return []
  const appSet = new Set(connectedApps.map((a) => a.toLowerCase()))
  const skillSet = new Set(installedSkills.map((s) => s.name.toLowerCase()))
  const out = []
  const seenSlugs = new Set()
  for (const p of raw) {
    if (!p || !p.name || !p.skillMd) continue
    const slug = slugify(p.slug || p.name)
    if (seenSlugs.has(slug)) continue
    seenSlugs.add(slug)
    // Drop any tool not actually connected (defense-in-depth against hallucination).
    const tools = Array.isArray(p.tools)
      ? p.tools.filter((t) => appSet.has(String(t).toLowerCase()))
      : []
    const composes = Array.isArray(p.composes)
      ? p.composes.filter((c) => skillSet.has(String(c).toLowerCase()))
      : []
    const confidence = Math.max(0, Math.min(1, Number(p.confidence) || 0))
    out.push({
      name: String(p.name).trim(),
      slug,
      job: String(p.job || '').trim(),
      tools,
      composes,
      trigger: String(p.trigger || '').trim(),
      confidence,
      rationale: String(p.rationale || '').trim(),
      skillMd: String(p.skillMd),
    })
  }
  out.sort((a, b) => b.confidence - a.confidence)
  return out.slice(0, PROPOSAL_MAX)
}

async function synthesize(inv, mining) {
  const messages = [
    { role: 'system', content: SYNTH_SYSTEM },
    { role: 'user', content: buildSynthUser(inv, mining) },
  ]
  const raw = parseJsonLoose(await callGateway(messages))
  return sanitizeProposals(raw, inv.connectedApps, inv.installedSkills)
}

// --- Step D: emit idempotent drafts ------------------------------------------
function emit(proposals, { dry } = {}) {
  let created = 0
  let skipped = 0
  const index = lib.readIndex()
  const existingSources = new Set((index.skills || []).map((s) => s.source))
  const landed = []
  for (const p of proposals) {
    const source = `proposed:${p.slug}`
    if (existingSources.has(source)) { skipped++; continue }
    if (dry) { created++; landed.push(p); continue }
    const res = lib.addEntry({
      type: 'skill',
      name: p.name,
      description: p.job,
      tags: ['proposed'],
      source,
      status: 'draft',
      body: p.skillMd,
    })
    if (res.created) { created++; landed.push(p) } else { skipped++ }
  }
  if (!dry && created > 0) lib.regenerateIndex()
  return { created, skipped, landed }
}

// --- Orchestrator ------------------------------------------------------------
async function run(opts = {}) {
  const noAi = opts.noAi || process.argv.includes('--no-ai')
  const dry = opts.dry || process.argv.includes('--dry')

  console.log('=== propose-skills: composite skill proposal engine ===')
  const inv = await inventory()
  console.log(`[A] inventory: ${inv.connectedApps.length} connected apps (${inv.appsDetection.source}: ${inv.connectedApps.join(', ') || 'none'}), ${inv.installedSkills.length} installed skills`)

  const mining = await mineConversations()
  if (mining.available) {
    console.log(`[B] mined ${mining.messageCount} msgs across ${mining.channelsMined.length} channels: ` +
      mining.channelsMined.map((c) => `#${c.name}(${c.msgs})`).join(', '))
  } else {
    console.log(`[B] conversation mining UNAVAILABLE — ${mining.note}`)
  }

  if (noAi) {
    console.log('[C] --no-ai: skipping LLM synthesis, emitting nothing.')
    return { inv, mining, proposals: [], emit: { created: 0, skipped: 0, landed: [] } }
  }

  // Idempotency gate: propose once. Re-runs are no-ops unless --refresh.
  const refresh = opts.refresh || process.argv.includes('--refresh')
  const existingProposed = (inv.index.skills || []).filter((s) =>
    String(s.source || '').startsWith('proposed:'))
  if (existingProposed.length > 0 && !refresh) {
    console.log(`[C] ${existingProposed.length} proposed drafts already exist — skipping synthesis (idempotent). Pass --refresh to regenerate.`)
    console.log('[D] drafts created=0 skipped(existing)=' + existingProposed.length)
    return { inv, mining, proposals: [], emit: { created: 0, skipped: existingProposed.length, landed: [] }, skippedExisting: true }
  }

  let proposals = []
  try {
    proposals = await synthesize(inv, mining)
  } catch (e) {
    console.error(`[C] synthesis failed: ${e.message}`)
    return { inv, mining, proposals: [], emit: { created: 0, skipped: 0, landed: [] }, error: e.message }
  }
  console.log(`[C] synthesized ${proposals.length} composite proposals (model ${MODEL})`)

  const emitRes = emit(proposals, { dry })
  console.log(`[D] drafts ${dry ? '(dry-run) ' : ''}created=${emitRes.created} skipped(existing)=${emitRes.skipped}`)

  // Human-readable proposal table.
  console.log('\n--- proposed composite skills ---')
  for (const p of proposals) {
    const tools = p.tools.length ? p.tools.join('+') : '—'
    const comp = p.composes.length ? ` | composes: ${p.composes.join(', ')}` : ''
    console.log(`• ${p.name}  [conf ${p.confidence.toFixed(2)}]  tools: ${tools}${comp}`)
    console.log(`    job: ${p.job}`)
    console.log(`    why: ${p.rationale}`)
  }

  return { inv, mining, proposals, emit: emitRes }
}

if (require.main === module) {
  run().then((r) => {
    if (r.error) process.exitCode = 1
  }).catch((e) => { console.error(e); process.exit(1) })
}

module.exports = { run, inventory, mineConversations, synthesize, emit }
