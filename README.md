# @aomni-com/duet-skills

Curated registry of Duet skills (industry/use-case-specific capabilities) and the surfaces that promote them.

## Two concepts

- **Skill** — a capability the sandbox can perform (`skills/<id>/SKILL.md`). Owned by the sandbox; ships with prompt body, model, and tool list.
- **Use case** — a surface placement that points at a skill (`src/use-cases.ts`). Owned by the web; ships with title, label, icon, prompt template, surfaces, and order. **Use cases never override skill behavior.**

A single skill can power multiple use cases. The `skillId` field is the contract — folder names equal the id by convention, but consumers reference the id, not the path.

## What lives where

Two repos host skills, both queryable by id from the same `UseCase.skillId`:

| Repo                            | What                                                                                  | Loaded                                          |
| ------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `chat-app/.../default-skills/`  | **Default skills** — primitives every sandbox boots with (firecrawl, pdf, cron, etc.) | Always; embedded in the sandbox image           |
| `aomni-com/duet-skills` (this)  | **Industry / use-case-specific skills** — workflows that compose primitives           | Via `@aomni-com/duet-skills` package            |

Use cases in this repo can reference **either** kind of skill by id. The list of valid external ids lives in `src/external-skills.ts` and is the contract chat-app's default-skills directory commits to.

When a default skill is added, removed, or renamed in chat-app, update `src/external-skills.ts` in the same PR.

## Repo layout

```
duet-skills/
├── skills/
│   └── <skill-id>/
│       ├── SKILL.md              required — frontmatter + markdown body
│       ├── examples.json         optional — eval fixtures
│       └── assets/               optional — schemas, tool configs
├── src/
│   ├── types.ts                  Skill, SkillMetadata, UseCase, Surface
│   ├── runtime.ts                @duet/skills/runtime — full registry (sandbox)
│   ├── use-cases.ts              @duet/skills/use-cases — curation only (web)
│   └── generated.ts              auto-generated from skills/ by build:registry
└── scripts/
    └── build-registry.ts         walks skills/, parses SKILL.md, writes generated.ts
```

## Two entrypoints

- `@aomni-com/duet-skills/runtime` — full registry including each skill's prompt body. Imported by the sandbox at boot.
- `@aomni-com/duet-skills/use-cases` — metadata-only view (no prompt body) plus the use-case list. Imported by the web for tooltips, chips, and marketing.

This split keeps web bundles clean — prompt bodies never reach the browser. Both entrypoints also export `KNOWN_DEFAULT_SKILL_IDS` and `isKnownDefaultSkillId(id)` for cross-repo skill resolution.

## SKILL.md frontmatter

```yaml
---
id: deep-research
name: Deep Research
description: Multi-source research with citations.
model: claude-opus-4-7
tools: [web-search, firecrawl, file-write]
---

You are a research agent. When given a query…
```

Required: `id`, `name`, `description`. Optional: `model`, `tools`.

## Invariants

1. **Use cases cannot override skill behavior.** No `systemPrompt` / `tools` / `model` on `UseCase` — TypeScript prevents it. Otherwise a chip could promise behavior the skill doesn't deliver.
2. **Use cases are pure curation.** They specify which skill, what to call it on this surface, what to prefill, where to render, in what order. No logic.
3. **Every `UseCase.skillId` must resolve.** Either to a local skill in this repo OR to a known default-skill id in `KNOWN_DEFAULT_SKILL_IDS`. The build script verifies this.
4. **Never rename a skill `id`.** Only deprecate. Folder paths can be reorganized; ids cannot.

## Versioning

- `minor` — new skills or use cases
- `patch` — copy / icon / order tweaks
- `major` — only when a skill `id` is removed

Threads stamp the `@duet/skills` version they ran under for reproducibility.

## Adding a skill

1. `mkdir skills/<id>`
2. Create `SKILL.md` with frontmatter + body
3. (optional) Add `examples.json` for evals
4. `bun run build:registry` to regenerate `src/generated.ts`
5. (optional) Add a `UseCase` entry in `src/use-cases.ts` if you want the skill promoted on a surface

## Adding a use case

Edit `src/use-cases.ts`. Use cases are pure data:

```ts
{
  id: 'outbound-campaign-home',
  skillId: 'outbound-campaign',
  title: 'Run an outbound campaign',
  shortLabel: 'Outbound',
  icon: 'paper-plane-tilt',
  promptTemplate: 'Run an outbound campaign for: {input}',
  surfaces: ['home', 'desktop'],
  order: 2,
}
```

The same skill can appear with multiple framings — see `outbound-campaign-home` and `outbound-campaign-reactivate` in `src/use-cases.ts` for the canonical example.
