/**
 * @aomni-com/duet-skills/use-cases
 *
 * Metadata-only view of skills + the curated list of surface placements.
 * Safe to import from the web — prompt bodies are stripped.
 */

import type { Skill, SkillMetadata, UseCase } from './types.js'
import { SKILLS } from './generated.js'

export type { SkillMetadata, UseCase, Surface } from './types.js'
export { KNOWN_DEFAULT_SKILL_IDS, isKnownDefaultSkillId } from './external-skills.js'
export type { KnownDefaultSkillId } from './external-skills.js'

/** Strip prompt bodies. The result is browser-safe. */
const stripBody = (s: Skill): SkillMetadata => {
  const { body: _body, ...rest } = s
  return rest
}

export const SKILL_METADATA: readonly SkillMetadata[] = SKILLS.map(stripBody)

/**
 * The curated list of use cases. Order within a surface is determined by
 * `order` (ascending), then by array position.
 *
 * Use cases can reference TWO kinds of skills:
 *
 *   - **Local skills** — authored in this repo under `skills/<id>/SKILL.md`.
 *     Shipped via `@aomni-com/duet-skills` and listed in `SKILL_METADATA`.
 *   - **External default skills** — authored in chat-app under
 *     `packages/backend/registry/sandbox/default-skills/<id>/SKILL.md`.
 *     Always present in the sandbox at boot, regardless of whether this
 *     package is installed. Their ids are listed in
 *     `KNOWN_DEFAULT_SKILL_IDS`.
 *
 * Both are valid `skillId` targets. The build script validates every
 * `skillId` resolves to one set or the other; consumers (the web) resolve
 * metadata for local ids via `SKILL_METADATA` and for external ids via the
 * chat-app default-skills metadata.
 *
 * Invariants enforced at build time:
 * - Every `skillId` references either a local or external known id.
 * - No behavior overrides — see `ForbiddenOnUseCase` in types.ts.
 *
 * Icon names follow Phosphor's kebab-case convention. Consumers map them
 * to icon components via a small resolver.
 */
export const USE_CASES: readonly UseCase[] = [
  {
    id: 'generate-image',
    skillId: 'media-creation', // chat-app default
    title: 'Generate an image',
    shortLabel: 'Image',
    icon: 'image',
    promptTemplate: 'Generate an image of: {input}',
    surfaces: ['home', 'desktop'],
    order: 1,
  },
  {
    id: 'deep-research-home',
    skillId: 'deep-research',
    title: 'Deep research',
    shortLabel: 'Research',
    icon: 'magnifying-glass',
    promptTemplate: 'Do deep research on: {input}',
    surfaces: ['home', 'desktop'],
    order: 2,
  },
  {
    id: 'get-news',
    skillId: 'deep-research',
    title: 'Get news about',
    shortLabel: 'News',
    icon: 'globe',
    promptTemplate: 'Get me the latest news about: {input}',
    surfaces: ['home', 'desktop'],
    order: 3,
  },
  {
    id: 'brainstorm',
    skillId: 'deep-research',
    title: 'Brainstorm a topic',
    shortLabel: 'Brainstorm',
    icon: 'lightbulb',
    promptTemplate: 'Help me brainstorm ideas for: {input}',
    surfaces: ['home', 'desktop'],
    order: 4,
  },
  {
    id: 'competitor-research',
    skillId: 'deep-research',
    title: 'Competitor research',
    shortLabel: 'Competitors',
    icon: 'building',
    promptTemplate: 'Research competitors for: {input}',
    surfaces: ['home', 'desktop'],
    order: 5,
  },
  {
    id: 'create-app',
    skillId: 'build-apps', // chat-app default
    title: 'Create an app',
    shortLabel: 'App',
    icon: 'app-window',
    promptTemplate: 'Create an app that {input}',
    surfaces: ['desktop'],
    order: 6,
  },
] as const

/** Look up use cases by surface. Returns them sorted by `order` then array position. */
export function getUseCasesForSurface(surface: UseCase['surfaces'][number]): readonly UseCase[] {
  return USE_CASES.filter((u) => u.surfaces.includes(surface)).slice().sort((a, b) => {
    const ao = a.order ?? Number.POSITIVE_INFINITY
    const bo = b.order ?? Number.POSITIVE_INFINITY
    return ao - bo
  })
}

/**
 * Look up the skill metadata referenced by a use case **from this package**.
 *
 * Returns `undefined` if the `skillId` references an external default skill
 * (one of `KNOWN_DEFAULT_SKILL_IDS`). The caller is responsible for
 * resolving external ids against chat-app's default-skill metadata.
 */
export function getSkillForUseCase(useCase: UseCase): SkillMetadata | undefined {
  return SKILL_METADATA.find((s) => s.id === useCase.skillId)
}

/** Look up a use case by id. */
export function getUseCaseById(id: string): UseCase | undefined {
  return USE_CASES.find((u) => u.id === id)
}
