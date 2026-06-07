---
id: create-custom-skills
name: Create Custom Skills
description: Bootstrap your personal Skills & Boards Library. Scans your workspace (installed skills, connected Composio tools, team conversations) and generates a browsable internal app at a public URL. Use when the user types `/create-custom-skills` or `/hiten-custom-skills` or asks to set up their skills library.
model: claude-opus-4-7
tools: [integrations, file-write, code-execution]
---

# Create Custom Skills

Bootstraps a personal Skills & Boards Library for **any** workspace by scanning installed skills, dynamically-detected connected Composio tools, and team conversations, then deploying an internal browsing app to the workspace's own public URL. No workspace-specific values are hardcoded — it is portable to any new or existing Duet user.

## Trigger
- `/create-custom-skills`
- `/hiten-custom-skills`

## What it does
1. Seeds the library with all installed skills (idempotent)
2. **Dynamically detects connected Composio apps** and scans them into 1:1 draft skills (idempotent)
3. **Proposes composite skills** — mines the workspace's TOOLS (connected Composio apps + installed skills as building blocks) and CONVERSATIONS (recurring jobs people ask for across the most active channels), then asks an LLM to synthesize a tight set of 5-8 high-confidence COMPOSITE skills that chain multiple tools/skills (many-to-many). Each lands as an idempotent draft (`source: proposed:<slug>`).
4. Generates SKILL.md drafts into `~/.duet/library/`
5. **Deploys the bundled web-app template** to `~/public/skills-library/`, installs deps if missing, (re)starts the server, and refreshes tool pills
6. **Resolves the public URL dynamically** and reports the live URL + library counts

> **Phase 1 scope:** proposals mine CONVERSATIONS + TOOLS only. Filesystem signal is a planned **phase 2**. If the Duet API is unreachable, the proposal pass degrades gracefully to tools-only and says so — it never fabricates conversation evidence.

## Portability — how it adapts to each workspace

- **Connected apps (`composio-apps.js`):** detected at runtime by calling Duet's Composio proxy `POST {APP_URL}/api/v1/composio/execute/COMPOSIO_CHECK_ACTIVE_CONNECTION` (one probe per candidate toolkit, key-only — no MCP/session needed). Keeps the toolkits that report `active_connection: true`. Probes a curated candidate set of common toolkits; override/extend with `COMPOSIO_TOOLKITS` (comma-separated slugs). Falls back to a documented default set (gmail, slack, stripe, google_search_console) only if `DUET_API_KEY` is missing or the proxy is unreachable.
- **Public URL (`workspace.js`):** resolved from `GET {APP_URL}/api/v1/organization` → `data.slug`, composed as `https://{appSlug}--{orgSlug}.duet.so` (appSlug defaults to `library`, override with `LIBRARY_APP_SLUG`). Override the whole URL with `PUBLIC_URL`/`LIBRARY_PUBLIC_URL`. Falls back to a localhost health check if the org slug can't be resolved.
- **App deploy (`bootstrap.js`):** copies `app/` into `~/public/skills-library/`, runs `npm install` if `node_modules` is missing, and (re)starts the server (kills the running process so the gateway respawns fresh code; self-spawns detached if nothing supervises it). Never clobbers `tools-cache.json`, `node_modules`, or `server.log`. Best-effort registers the app with the Duet gateway public config when a `channelId` is available (existing entry or `LIBRARY_CHANNEL_ID`).

## Usage
Simply invoke the skill. The agent will run:
```bash
node ~/.agents/skills/create-custom-skills/bootstrap.js
```
and report back the public URL.

For a brand-new workspace where the app isn't registered yet, either set `LIBRARY_CHANNEL_ID` before running, or register the app afterward with the `build-apps` skill (slug `library`, type `service`, cwd `public/skills-library`, `PORT=4950 node server.js`).

## Files
- `bootstrap.js` — end-to-end orchestrator (seed → scan → propose → deploy → health)
- `scan.js` — connected-Composio 1:1 draft scanner (dynamic detection)
- `propose-skills.js` — composite skill-proposal engine (conversations + tools → grounded drafts)
- `seed.js` — idempotent library seeder from installed skills
- `lib.js` — shared library I/O helpers
- `composio-apps.js` — dynamic connected-Composio-app detection
- `workspace.js` — dynamic public-URL resolution
- `app/` — the web-app template deployed to `~/public/skills-library/` (server.js, enrich-tools.js, package.json, package-lock.json, icon.png, public/index.html)

## Note on distribution
This skill is published to the `@aomni-com/duet-skills` package so it is available to all Duet users, not just the workspace it was built in.
