'use strict'
// End-to-end orchestrator for the Skills & Boards Library. Portable: no
// workspace-specific values are hardcoded.
//   1. Seed the library from installed skills (idempotent)
//   2. Scan DYNAMICALLY-detected connected Composio apps into draft entries
//   3. Propose composite skills (conversations + tools -> grounded drafts)
//   4. DEPLOY the bundled web-app template to ~/public/skills-library/ and
//      (re)start the server (idempotent; preserves tools-cache.json)
//   5. Resolve the public URL dynamically and health-check it
//   6. Print a summary
const fs = require('fs')
const os = require('os')
const path = require('path')
const { execFileSync, spawn } = require('child_process')

const seed = require('./seed.js')
const scan = require('./scan.js')
const propose = require('./propose-skills.js')
const lib = require('./lib.js')
const { resolvePublicUrl, appSlug } = require('./workspace.js')

const SKILL_DIR = __dirname
const APP_TEMPLATE_DIR = path.join(SKILL_DIR, 'app')
const PUBLIC_APP_DIR = path.join(os.homedir(), 'public', 'skills-library')
const PORT = Number(process.env.LIBRARY_PORT || 4950)
const GATEWAY = process.env.DUET_GATEWAY_LOCAL || 'http://localhost:8888'

// Files copied from the template on every deploy (kept fresh). Runtime-only
// artifacts (tools-cache.json, node_modules, server.log) are NEVER clobbered.
const TEMPLATE_FILES = [
  'server.js',
  'enrich-tools.js',
  'package.json',
  'package-lock.json',
  'icon.png',
  path.join('public', 'index.html'),
]

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function localHealthy() {
  try {
    const out = execFileSync('curl', ['-s', '--max-time', '5', `http://localhost:${PORT}/healthz`], { encoding: 'utf8' }).trim()
    return !!JSON.parse(out).ok
  } catch {
    return false
  }
}

function healthcheck(url) {
  try {
    const out = execFileSync('curl', ['-s', '--max-time', '15', `${url}/healthz`], { encoding: 'utf8' }).trim()
    const json = JSON.parse(out)
    return { ok: !!json.ok, raw: out }
  } catch (e) {
    return { ok: false, raw: e.message }
  }
}

// --- Step 4a: copy the template into the deploy dir --------------------------
function deployFiles() {
  fs.mkdirSync(path.join(PUBLIC_APP_DIR, 'public'), { recursive: true })
  let copied = 0
  for (const rel of TEMPLATE_FILES) {
    const src = path.join(APP_TEMPLATE_DIR, rel)
    if (!fs.existsSync(src)) continue
    const dest = path.join(PUBLIC_APP_DIR, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.copyFileSync(src, dest)
    copied++
  }
  return copied
}

// --- Step 4b: install deps if missing ----------------------------------------
function ensureDeps() {
  const nm = path.join(PUBLIC_APP_DIR, 'node_modules')
  if (fs.existsSync(nm)) return { installed: false }
  console.log('[deploy] node_modules missing — running npm install...')
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], {
    cwd: PUBLIC_APP_DIR,
    timeout: 240000,
    stdio: 'inherit',
  })
  return { installed: true }
}

// Find pids of a `node server.js` process whose cwd is the deploy dir.
function findServerPids() {
  const pids = []
  let entries = []
  try {
    entries = fs.readdirSync('/proc').filter((n) => /^\d+$/.test(n))
  } catch {
    return pids
  }
  for (const pid of entries) {
    try {
      const cwd = fs.readlinkSync(`/proc/${pid}/cwd`)
      if (cwd !== PUBLIC_APP_DIR) continue
      const cmdline = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ')
      if (/node\b.*server\.js/.test(cmdline)) pids.push(Number(pid))
    } catch {
      /* process vanished or not ours — skip */
    }
  }
  return pids
}

function spawnDetached() {
  const logPath = path.join(PUBLIC_APP_DIR, 'server.log')
  const out = fs.openSync(logPath, 'a')
  const child = spawn('node', ['server.js'], {
    cwd: PUBLIC_APP_DIR,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env, PORT: String(PORT) },
  })
  child.unref()
  return child.pid
}

// --- Step 4c: (re)start so fresh code is live --------------------------------
// Strategy: if a server is already running for this dir, kill it so the manager
// (Duet gateway) respawns it with the new files. If nothing comes back up
// (no external supervisor), spawn a detached process ourselves. Idempotent.
async function restartServer() {
  const before = findServerPids()
  for (const pid of before) {
    try { process.kill(pid, 'SIGTERM') } catch {}
  }
  if (before.length) console.log(`[deploy] stopped ${before.length} running server process(es) — waiting for respawn...`)

  // Poll for the port to come back (gateway-managed respawn).
  for (let i = 0; i < 24; i++) {
    await sleep(500)
    if (localHealthy()) return { restarted: true, mode: before.length ? 'respawned' : 'already-up' }
  }

  // Nothing supervising it — start it ourselves (re-check first to avoid a race).
  if (localHealthy()) return { restarted: true, mode: 'respawned' }
  const pid = spawnDetached()
  for (let i = 0; i < 20; i++) {
    await sleep(500)
    if (localHealthy()) return { restarted: true, mode: 'self-spawned', pid }
  }
  return { restarted: false, mode: 'failed', pid }
}

// --- Step 4d: best-effort public-config registration (portability) -----------
// Registers the app with the Duet gateway so it gets a public URL + sidebar
// entry. Idempotent: skips if a `library` slug app already exists. Needs a
// channelId — read from the existing entry or LIBRARY_CHANNEL_ID. Non-fatal.
function ensurePublicConfig() {
  const cfgPath = path.join(os.homedir(), '.duet', 'public.config.json')
  let cfg
  try {
    cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
  } catch {
    cfg = { version: 1, apps: [] }
  }
  const apps = Array.isArray(cfg.apps) ? cfg.apps : []
  const slug = appSlug()
  const existing = apps.find((a) => a.slug === slug)
  if (existing) return { registered: false, reason: 'already-registered' }

  const channelId = process.env.LIBRARY_CHANNEL_ID
  if (!channelId) {
    return { registered: false, reason: 'no-channel-id (set LIBRARY_CHANNEL_ID, or register via the build-apps skill)' }
  }

  const entry = {
    name: 'Skills & Boards Library',
    channelId,
    path: '/',
    slug,
    icon: 'public/skills-library/icon.png',
    type: 'service',
    command: `PORT=${PORT} node server.js`,
    port: PORT,
    cwd: 'public/skills-library',
  }
  try {
    execFileSync('curl', [
      '-s', '--max-time', '15', '-X', 'POST', `${GATEWAY}/session/public/config`,
      '-H', 'Content-Type: application/json',
      '-d', JSON.stringify({ config: { version: cfg.version || 1, apps: [...apps, entry] } }),
    ], { encoding: 'utf8' })
    return { registered: true }
  } catch (e) {
    return { registered: false, reason: e.message }
  }
}

async function run() {
  console.log('=== create-custom-skills bootstrap ===')

  // 1-2. Seed + scan (scan detects connected apps dynamically).
  const seedRes = seed.run()
  const scanRes = await scan.run()

  // 3. Mine conversations + tools and synthesize composite skill proposals
  // (idempotent; degrades to tools-only if the Duet API is unavailable).
  let proposeRes = { proposals: [], emit: { created: 0, skipped: 0 } }
  try {
    proposeRes = await propose.run()
  } catch (e) {
    console.error('[propose] failed:', e.message)
  }

  // 4. Deploy the bundled app template + (re)start the server.
  console.log('[deploy] copying app template -> ' + PUBLIC_APP_DIR)
  const copied = deployFiles()
  let depErr = null
  try { ensureDeps() } catch (e) { depErr = e.message; console.error('[deploy] npm install failed:', e.message) }
  const restart = await restartServer()
  console.log(`[deploy] files=${copied} restart=${restart.mode} healthy=${restart.restarted}`)
  const reg = ensurePublicConfig()
  console.log(`[deploy] public-config: ${reg.registered ? 'registered' : 'skipped (' + reg.reason + ')'}`)

  // New draft proposals just landed (or files changed) — refresh tool pills.
  try {
    execFileSync('node', ['enrich-tools.js'], { cwd: PUBLIC_APP_DIR, timeout: 150000, stdio: 'ignore' })
  } catch (e) {
    console.error('[deploy] enrich-tools failed:', e.message)
  }

  // 5. Resolve the public URL dynamically + health-check.
  const resolved = await resolvePublicUrl()
  console.log(`[url] ${resolved.note}`)
  let health = { ok: false, raw: 'no url' }
  if (resolved.url) {
    health = healthcheck(resolved.url)
    console.log(`[health] ${resolved.url}/healthz -> ${health.raw}`)
  }
  // Fall back to localhost if the public URL isn't routable yet.
  const localOk = localHealthy()
  if (!health.ok && localOk) {
    console.log(`[health] public URL not ready; localhost:${PORT}/healthz -> {"ok":true}`)
  }

  const index = lib.readIndex()
  console.log('--- summary ---')
  console.log(`skills: ${index.counts.skills}`)
  console.log(`boards: ${index.counts.boards}`)
  console.log(`seed: +${seedRes.created} new, ${seedRes.skipped} existing`)
  console.log(`scan: +${scanRes.created} new drafts, ${scanRes.skipped} existing (apps: ${scanRes.detected.source} -> ${scanRes.detected.apps.map((a) => a.app).join(', ') || 'none'})`)
  console.log(`propose: +${proposeRes.emit.created} new proposals, ${proposeRes.emit.skipped} existing`)
  console.log(`app deployed: ${restart.restarted}`)
  console.log(`public url: ${resolved.url || '(unresolved)'}`)
  console.log(`url healthy: ${health.ok || localOk}`)
  if (depErr) console.log(`WARN npm install: ${depErr}`)

  return { index, seedRes, scanRes, proposeRes, restart, reg, resolved, health, localOk }
}

if (require.main === module) run().catch((e) => { console.error(e); process.exit(1) })
module.exports = { run, PUBLIC_APP_DIR, resolvePublicUrl }
