'use strict'
// Shared library I/O helpers for the Skills & Boards Library.
// The library root lives at ~/.duet/library/ with this layout:
//   index.json                 -> generated aggregate { generatedAt, counts, skills[], boards[] }
//   skills/<uuid>/meta.json     -> per-skill metadata
//   skills/<uuid>/SKILL.md      -> the skill body
//   boards/<uuid>/meta.json     -> per-board metadata
//   boards/<uuid>/definition.json
const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')

function getLibraryDir() {
  return path.join(os.homedir(), '.duet', 'library')
}

const LIBRARY_DIR = getLibraryDir()
const SKILLS_DIR = path.join(LIBRARY_DIR, 'skills')
const BOARDS_DIR = path.join(LIBRARY_DIR, 'boards')
const INDEX_FILE = path.join(LIBRARY_DIR, 'index.json')

function ensureDirs() {
  fs.mkdirSync(SKILLS_DIR, { recursive: true })
  fs.mkdirSync(BOARDS_DIR, { recursive: true })
}

function readJSON(file, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function writeJSON(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(obj, null, 2))
}

// Scan a per-type directory for entries that contain a meta.json.
function collect(dir) {
  if (!fs.existsSync(dir)) return []
  const out = []
  for (const id of fs.readdirSync(dir)) {
    const meta = readJSON(path.join(dir, id, 'meta.json'))
    if (meta) out.push(meta)
  }
  out.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  return out
}

// Rebuild index.json from what is actually on disk and return it.
function regenerateIndex() {
  ensureDirs()
  const skills = collect(SKILLS_DIR)
  const boards = collect(BOARDS_DIR)
  const index = {
    generatedAt: new Date().toISOString(),
    counts: { skills: skills.length, boards: boards.length },
    skills,
    boards,
  }
  writeJSON(INDEX_FILE, index)
  return index
}

function readIndex() {
  return fs.existsSync(INDEX_FILE) ? readJSON(INDEX_FILE) : regenerateIndex()
}

function writeIndex(index) {
  writeJSON(INDEX_FILE, index)
  return index
}

// True if an entry with this name already exists for the given type.
function hasEntry(name, type = 'skill') {
  const dir = type === 'board' ? BOARDS_DIR : SKILLS_DIR
  const wanted = String(name || '').toLowerCase()
  return collect(dir).some((m) => String(m.name || '').toLowerCase() === wanted)
}

// Add a library entry. Idempotent: returns the existing entry if the name is
// already present for that type. `body` is written to SKILL.md (skills) or
// definition.json (boards) when provided.
function addEntry({ type = 'skill', name, description = '', tags = [], source = '', status, body } = {}) {
  ensureDirs()
  if (!name) throw new Error('addEntry requires a name')
  const dir = type === 'board' ? BOARDS_DIR : SKILLS_DIR

  const existing = collect(dir).find(
    (m) => String(m.name || '').toLowerCase() === String(name).toLowerCase()
  )
  if (existing) return { created: false, meta: existing }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const meta = {
    id,
    type,
    name,
    description,
    tags,
    source,
    createdAt: now,
  }
  if (type === 'skill') {
    meta.status = status || 'published'
    if (meta.status === 'published') meta.publishedAt = now
  } else if (status) {
    meta.status = status
  }

  const entryDir = path.join(dir, id)
  fs.mkdirSync(entryDir, { recursive: true })
  writeJSON(path.join(entryDir, 'meta.json'), meta)
  if (type === 'skill' && body != null) {
    fs.writeFileSync(path.join(entryDir, 'SKILL.md'), body)
  } else if (type === 'board' && body != null) {
    writeJSON(path.join(entryDir, 'definition.json'), body)
  }
  return { created: true, meta }
}

module.exports = {
  // paths / constants used by the web app server
  LIBRARY_DIR,
  SKILLS_DIR,
  BOARDS_DIR,
  INDEX_FILE,
  // primitives
  getLibraryDir,
  readJSON,
  writeJSON,
  // index helpers
  readIndex,
  writeIndex,
  regenerateIndex,
  // entry helpers
  hasEntry,
  addEntry,
  ensureDirs,
}
