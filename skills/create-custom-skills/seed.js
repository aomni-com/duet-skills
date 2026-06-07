'use strict'
// Seed the library with every installed skill on this workspace.
// Reads SKILL.md frontmatter from ~/.agents/skills/ and ~/.duet/skills/ and
// creates a published library entry for each. Idempotent: an existing name is
// skipped (dedup by name across both source roots).
const fs = require('fs')
const os = require('os')
const path = require('path')
const lib = require('./lib.js')

const SOURCE_ROOTS = [
  path.join(os.homedir(), '.agents', 'skills'),
  path.join(os.homedir(), '.duet', 'skills'),
]

// Minimal YAML frontmatter reader: pulls top-level `name` and `description`.
function parseFrontmatter(md) {
  const m = /^---\s*\n([\s\S]*?)\n---/.exec(md)
  if (!m) return {}
  const out = {}
  const block = m[1]
  // Match `key: value`, supporting quoted and multi-line folded values loosely.
  const re = /^(name|description)\s*:\s*(.*)$/gm
  let mm
  while ((mm = re.exec(block))) {
    let v = mm[2].trim()
    if (v === '>-' || v === '>' || v === '|' || v === '|-') {
      // Folded/literal scalar — grab following indented lines.
      const rest = block.slice(re.lastIndex).split('\n')
      const lines = []
      for (const line of rest) {
        if (/^\s+\S/.test(line)) lines.push(line.trim())
        else break
      }
      v = lines.join(' ')
    }
    v = v.replace(/^["']|["']$/g, '').trim()
    out[mm[1]] = v
  }
  return out
}

function readSkillMd(dir) {
  const p = path.join(dir, 'SKILL.md')
  try {
    return fs.readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

function run() {
  let created = 0
  let skipped = 0
  const seenNames = new Set()

  for (const root of SOURCE_ROOTS) {
    if (!fs.existsSync(root)) continue
    for (const entry of fs.readdirSync(root)) {
      const dir = path.join(root, entry)
      if (!fs.statSync(dir).isDirectory()) continue
      const md = readSkillMd(dir)
      if (!md) continue
      const fm = parseFrontmatter(md)
      const name = fm.name || entry
      const key = name.toLowerCase()
      if (seenNames.has(key)) {
        skipped++
        continue
      }
      seenNames.add(key)
      const res = lib.addEntry({
        type: 'skill',
        name,
        description: fm.description || '',
        tags: ['installed'],
        source: `installed:${entry}`,
        status: 'published',
        body: md,
      })
      if (res.created) created++
      else skipped++
    }
  }

  const index = lib.regenerateIndex()
  console.log(`[seed] created=${created} skipped=${skipped} total_skills=${index.counts.skills}`)
  return { created, skipped, counts: index.counts }
}

if (require.main === module) run()
module.exports = { run, parseFrontmatter }
