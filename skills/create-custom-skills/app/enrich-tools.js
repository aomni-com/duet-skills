'use strict'
// enrich-tools.js — Persisted AI-based tool/dependency classification for the
// Skills & Boards Library.
//
// For each skill we want a TOOLS/DEPENDENCIES list. Instead of keyword matching
// we ask an LLM (via the Duet AI Gateway) to read each installed skill's
// SKILL.md and label which EXTERNAL tools/services it needs, from a small fixed
// vocabulary. composio:<app> skills are deterministic (the app name) and never
// hit the model. TYPE is NOT computed here — it stays deterministic in server.js.
//
// Results are written to tools-cache.json keyed by skill `source`, each entry
// carrying { tools, hash, generatedAt }. Idempotent: a skill whose SKILL.md
// content hash already matches its cache entry is skipped. Run standalone:
//   node enrich-tools.js          (only (re)classify changed/missing skills)
//   node enrich-tools.js --force  (reclassify everything)

const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')

// Reuse the SAME library helpers + source->SKILL.md resolution as server.js.
function resolveScannerDir() {
  const candidates = [
    path.join(os.homedir(), '.agents', 'skills', 'create-custom-skills'),
    path.join(os.homedir(), '.duet', 'skills', 'create-custom-skills'),
    path.join(os.homedir(), '.duet', 'skills', 'library-scanner'),
  ]
  return candidates.find((d) => fs.existsSync(path.join(d, 'lib.js'))) || candidates[0]
}
const lib = require(path.join(resolveScannerDir(), 'lib.js'))

const SKILL_SOURCE_DIRS = [
  path.join(os.homedir(), '.agents', 'skills'),
  path.join(os.homedir(), '.claude', 'skills'),
  path.join(os.homedir(), '.duet', 'skills'),
]

// Composio provider -> the connected app it exposes (kept in sync with server.js).
const COMPOSIO_TOOL_NAMES = {
  gmail: 'Gmail',
  slack: 'Slack',
  stripe: 'Stripe',
  google_search_console: 'Google Search Console',
}

const CACHE_FILE = path.join(__dirname, 'tools-cache.json')
const MODEL = process.env.ENRICH_MODEL || 'openai/gpt-4.1-mini'
const GATEWAY_URL = 'https://duet.so/api/v1/ai-gateway/v1/chat/completions'
const MD_CHAR_CAP = 2000
const BATCH_SIZE = 8 // SKILL.md excerpts per AI call
const CONCURRENCY = 5 // parallel AI calls

// Controlled vocabulary — keep SMALL and fixed so badges stay consistent.
const VOCAB = [
  'GitHub', 'Web', 'Composio', 'Media/AI', 'Email', 'Browser',
  'Data/Analytics', 'CRM', 'Code', 'Calendar', 'Slack', 'Payments',
]
const VOCAB_SET = new Set(VOCAB.map((v) => v.toLowerCase()))

function titleCaseApp(s) {
  return String(s || '').split(/[_\s-]+/).filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function resolveSkillMdPath(source, fallbackName) {
  const src = String(source || '')
  const name = src.startsWith('installed:') ? src.slice('installed:'.length) : fallbackName
  if (!name) return null
  for (const base of SKILL_SOURCE_DIRS) {
    const p = path.join(base, name, 'SKILL.md')
    if (fs.existsSync(p)) return p
  }
  return null
}

function sha256(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex')
}

function readCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')) } catch { return {} }
}
function writeCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))
}

// Keep only vocabulary labels, de-duplicated, order-stable per VOCAB.
function normalizeLabels(arr) {
  if (!Array.isArray(arr)) return []
  const seen = new Set()
  for (const item of arr) {
    const key = String(item || '').trim().toLowerCase()
    if (VOCAB_SET.has(key)) seen.add(key)
  }
  return VOCAB.filter((v) => seen.has(v.toLowerCase()))
}

const SYSTEM_PROMPT =
  'You are classifying what EXTERNAL tools/services/dependencies an agent skill ' +
  'needs to do its job, based on its SKILL.md. Return ONLY labels from this exact ' +
  'set: ' + VOCAB.join(', ') + '. If the skill is pure reasoning/design/writing and ' +
  'needs no external service (e.g. a UI critique or text-distillation skill), return ' +
  'an empty array. Do not invent labels outside the set. Return STRICT JSON.'

async function callGateway(messages) {
  const res = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DUET_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: MODEL, temperature: 0, messages }),
  })
  if (!res.ok) throw new Error(`gateway ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// Strip ```json fences / prose and parse the first JSON value found.
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

// Classify a batch of {name, source, excerpt}. Returns Map source->labels[].
async function classifyBatch(batch) {
  const out = new Map()
  const userPayload = batch.map((b, i) =>
    `### Skill ${i + 1}: ${b.name}\n${b.excerpt}`).join('\n\n')
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content:
        `Classify each skill below. Return STRICT JSON: an object mapping each ` +
        `skill name (exactly as given) to an array of labels from the allowed set.\n\n` +
        userPayload,
    },
  ]
  let parsed = null
  try {
    parsed = parseJsonLoose(await callGateway(messages))
  } catch (e) {
    console.error(`  batch AI error (${batch.map((b) => b.name).join(',')}):`, e.message)
  }
  for (const b of batch) {
    let labels = []
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      labels = normalizeLabels(parsed[b.name])
    }
    out.set(b.source, labels)
  }
  return out
}

async function runPool(items, worker, concurrency) {
  let idx = 0
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const my = items[idx++]
      await worker(my)
    }
  })
  await Promise.all(runners)
}

async function main() {
  const force = process.argv.includes('--force')
  const index = fs.existsSync(lib.INDEX_FILE) ? lib.readJSON(lib.INDEX_FILE) : lib.regenerateIndex()
  const skills = (index.skills || [])
  const cache = readCache()
  const now = Date.now()

  let composioCount = 0
  let skipped = 0
  const toClassify = [] // {name, source, excerpt, hash}

  for (const s of skills) {
    const src = String(s.source || '')
    if (src.startsWith('composio:')) {
      const app = src.slice('composio:'.length)
      cache[src] = {
        tools: [COMPOSIO_TOOL_NAMES[app] || titleCaseApp(app)],
        hash: 'composio',
        generatedAt: now,
      }
      composioCount++
      continue
    }
    // installed:<name> resolves to an on-disk skill dir; everything else
    // (custom / proposed: drafts) stores its SKILL.md inside the library entry.
    let p = resolveSkillMdPath(src, s.name)
    if (!p && s.id) {
      const libMd = path.join(lib.SKILLS_DIR, s.id, 'SKILL.md')
      if (fs.existsSync(libMd)) p = libMd
    }
    if (!p) { cache[src] = { tools: [], hash: 'missing', generatedAt: now }; continue }
    let md = ''
    try { md = fs.readFileSync(p, 'utf8') } catch {}
    const hash = sha256(md)
    if (!force && cache[src] && cache[src].hash === hash) { skipped++; continue }
    toClassify.push({ name: s.name, source: src, excerpt: md.slice(0, MD_CHAR_CAP), hash })
  }

  console.log(`skills=${skills.length} composio=${composioCount} cached(skip)=${skipped} toClassify=${toClassify.length}`)

  // Build batches.
  const batches = []
  for (let i = 0; i < toClassify.length; i += BATCH_SIZE) batches.push(toClassify.slice(i, i + BATCH_SIZE))

  let done = 0
  await runPool(batches, async (batch) => {
    const result = await classifyBatch(batch)
    for (const item of batch) {
      cache[item.source] = {
        tools: result.get(item.source) || [],
        hash: item.hash,
        generatedAt: Date.now(),
      }
    }
    done += batch.length
    console.log(`  classified ${done}/${toClassify.length}`)
  }, CONCURRENCY)

  writeCache(cache)
  console.log(`Wrote ${Object.keys(cache).length} entries -> ${CACHE_FILE}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
