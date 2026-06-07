'use strict'
// workspace.js — Resolve THIS workspace's public app URL dynamically, instead
// of hardcoding an org-specific subdomain.
//
// How Duet public app URLs are formed (see the build-apps skill): an app with a
// `slug` is served at  https://{slug}--{orgSlug}.duet.so . The orgSlug is the
// organization's URL slug, which the Duet REST API exposes verbatim at
//   GET {APP_URL}/api/v1/organization  ->  { data: { slug } }
// For this workspace that slug is e.g. `team-aomni-com`, so the library app
// (slug `library`) lives at https://library--team-aomni-com.duet.so .
//
// Resolution order:
//   1. PUBLIC_URL / LIBRARY_PUBLIC_URL env override (explicit wins).
//   2. GET /api/v1/organization -> compose https://{appSlug}--{slug}.duet.so .
//   3. null (caller should fall back to a localhost health check).
//
// appSlug defaults to `library`, overridable via LIBRARY_APP_SLUG.

const APP_BASE = process.env.DUET_APP_BASE_URL || process.env.APP_URL || 'https://duet.so'
const API_KEY = process.env.DUET_API_KEY
const FETCH_TIMEOUT_MS = 12000

function appSlug() {
  return (process.env.LIBRARY_APP_SLUG || 'library').toLowerCase()
}

// Derive the public-domain root from APP_BASE (e.g. https://duet.so -> duet.so).
function publicDomain() {
  try {
    return new URL(APP_BASE).host
  } catch {
    return 'duet.so'
  }
}

async function fetchOrgSlug() {
  if (!API_KEY) return null
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(`${APP_BASE}/api/v1/organization`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal: controller.signal,
    })
    if (!res.ok) return null
    const json = await res.json()
    const slug = json && json.data && json.data.slug
    return typeof slug === 'string' && slug ? slug : null
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

// Resolve the public URL. Returns { url, source, orgSlug, note }.
async function resolvePublicUrl() {
  const envUrl = process.env.LIBRARY_PUBLIC_URL || process.env.PUBLIC_URL
  if (envUrl) {
    return { url: envUrl.replace(/\/+$/, ''), source: 'env', orgSlug: null, note: 'Using PUBLIC_URL/LIBRARY_PUBLIC_URL override.' }
  }
  const slug = await fetchOrgSlug()
  if (slug) {
    const url = `https://${appSlug()}--${slug}.${publicDomain()}`
    return { url, source: 'organization-api', orgSlug: slug, note: `Resolved from GET /api/v1/organization (slug=${slug}).` }
  }
  return { url: null, source: 'unresolved', orgSlug: null, note: 'Could not resolve org slug (no DUET_API_KEY or API unreachable); caller should fall back to localhost.' }
}

module.exports = { resolvePublicUrl, fetchOrgSlug, appSlug, publicDomain }

if (require.main === module) {
  resolvePublicUrl()
    .then((r) => {
      console.log(`[workspace] source=${r.source} url=${r.url}`)
      console.log(`[workspace] ${r.note}`)
    })
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}
