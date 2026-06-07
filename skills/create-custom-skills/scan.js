'use strict'
// Lightweight workspace scanner. Generates SKILL.md *drafts* for the Composio
// apps THIS workspace has actually connected so the user has a starting point to
// publish from. Drafts are saved with status:draft and never overwrite an
// existing entry (dedup by source/name).
//
// Connected apps are detected DYNAMICALLY (composio-apps.js) via the Duet
// Composio proxy — no hardcoded per-workspace list. Degrades to a documented
// default set if detection is unavailable.
//
// Accepts `--no-ai` (the web app passes it) — this scanner is static by design,
// so the flag is accepted and ignored.
const lib = require('./lib.js')
const { detectConnectedApps } = require('./composio-apps.js')

function draftSkillMd(app) {
  return `---
name: ${app.name}
description: ${app.description}
---

# ${app.name}

> Auto-generated draft from the connected Composio app \`${app.app}\`. Edit and publish from the Skills & Boards Library.

## Trigger
- Mentions of ${app.app} operations in a workflow.

## What it does
Calls the \`${app.app}\` Composio integration. Flesh out the concrete operations,
required inputs, and example invocations before publishing.

## Status
Draft — review and publish to install into \`~/.agents/skills/\`.
`
}

async function run() {
  let created = 0
  let skipped = 0

  const detected = await detectConnectedApps()
  console.log(`[scan] connected-apps detection: source=${detected.source} — ${detected.note}`)

  // Dedup by source: a connected Composio provider may already have a published
  // or renamed entry (e.g. `gmail-triage` for `composio:gmail`). addEntry only
  // dedups by name, so check the current index by `source` first and skip if any
  // entry already represents this provider.
  const index = lib.readIndex()
  for (const app of detected.apps) {
    const newSource = `composio:${app.app}`
    if (index.skills.some((s) => s.source === newSource)) {
      skipped++
      continue
    }
    const res = lib.addEntry({
      type: 'skill',
      name: app.name,
      description: app.description,
      tags: ['composio', 'connected', 'draft', app.app],
      source: newSource,
      status: 'draft',
      body: draftSkillMd(app),
    })
    if (res.created) created++
    else skipped++
  }

  const finalIndex = lib.regenerateIndex()
  console.log(`[scan] composio_drafts created=${created} skipped=${skipped} total_skills=${finalIndex.counts.skills}`)
  return { created, skipped, counts: finalIndex.counts, detected }
}

if (require.main === module) run().catch((e) => { console.error(e); process.exit(1) })
module.exports = { run, draftSkillMd }
