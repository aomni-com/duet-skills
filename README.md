# duet-use-cases

Canonical TypeScript list of Duet use cases — single source of truth consumed by the home tab, desktop compose overlay, marketing site, onboarding flows, and docs.

## Why this repo exists

The "what can Duet do?" list was previously hard-coded in two places in `chat-app`:

- `apps/web/spa/chats/components/ai-chat-starter-card.tsx` (5 chips, home tab)
- `apps/web/spa/desktop/components/desktop-compose.tsx` (6 chips, desktop overlay)

…with subtly different labels and prompt phrasings between the two. Marketing copy and onboarding flows reach for the same list and end up duplicating it again.

This repo gives every surface one canonical list with richer metadata so we can change wording, ordering, and chip selection in one place.

## Usage

```ts
import {
  USE_CASES,
  getUseCasesForSurface,
  getUseCaseById,
  type UseCase,
} from "@duet/use-cases";

// Render the home tab chip rail
const homeChips = getUseCasesForSurface("home");

// Render the desktop overlay chip rail (terser labels)
const desktopChips = getUseCasesForSurface("desktop");

// Look up a single use case (e.g. for a deeplink target)
const research = getUseCaseById("deep-research");
```

## Schema

Each use case has the following fields:

| Field            | Type               | Notes                                                        |
| ---------------- | ------------------ | ------------------------------------------------------------ |
| `id`             | `string`           | Stable kebab-case identifier. Never rename — only deprecate. |
| `title`          | `string`           | Full title for marketing + onboarding.                       |
| `shortLabel`     | `string`           | Compact 1-word label for the desktop chip variant.           |
| `description`    | `string`           | One-sentence pitch (tooltips, meta descriptions).            |
| `icon`           | `string`           | Phosphor icon name (no `Icon` suffix).                       |
| `promptTemplate` | `string`           | Prefill string. `{input}` is the user's continuation.        |
| `examplePrompts` | `string[]`         | Concrete fully-formed examples for docs/SEO/demos.           |
| `category`       | `UseCaseCategory`  | One of 8 functional areas.                                   |
| `tags`           | `string[]`         | Freeform keywords for search/SEO.                            |
| `surfaces`       | `UseCaseSurface[]` | Which surfaces this renders on (`home`, `desktop`, …).       |
| `order`          | `number`           | Sort order (lower renders first).                            |

See [`src/types.ts`](./src/types.ts) for the full type definitions.

## Editing rules

From `MEMORY.md` (Walter, 2026-04-23):

> When I notice a new obvious use case from team activity, customer reports, or external signals, I must **propose** the addition to a human first and only update this file after confirmation. Do NOT silently add entries.

Stable `id` values are a contract with every consumer — never rename, only deprecate by removing surfaces.

## Development

```bash
bun install
bun run typecheck
bun run build
```

## Consumers

- `chat-app` home tab: `apps/web/spa/chats/components/ai-chat-starter-card.tsx`
- `chat-app` desktop overlay: `apps/web/spa/desktop/components/desktop-compose.tsx`
- Marketing site: `apps/web/content/...` and landing-page sections
- Onboarding flows
