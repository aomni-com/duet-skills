/**
 * @duet/skills/use-cases
 *
 * Metadata-only view of skills + the curated list of surface placements.
 * Safe to import from the web — prompt bodies are stripped.
 */

import type { Skill, SkillMetadata, UseCase } from './types.js'
import { SKILLS } from './generated.js'

export type { SkillMetadata, UseCase, Surface } from './types.js'

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
 * Invariants enforced at build time:
 * - Every `skillId` references a real Skill.id (build-registry checks this).
 * - No behavior overrides — see `ForbiddenOnUseCase` in types.ts.
 */
export const USE_CASES: readonly UseCase[] = [
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
    id: 'deep-research-company',
    skillId: 'deep-research',
    title: 'Research a company',
    shortLabel: 'Company',
    icon: 'building',
    promptTemplate: 'Research the company {input} — products, customers, recent news, competitive landscape.',
    surfaces: ['home'],
    order: 3,
  },
  {
    id: 'email-triage-home',
    skillId: 'email-triage',
    title: 'Triage my inbox',
    shortLabel: 'Triage',
    icon: 'envelope',
    promptTemplate: 'Triage my inbox. Classify each unread email and draft replies for the ones that need them.',
    surfaces: ['home', 'desktop'],
    order: 4,
  },
  {
    id: 'seo-content-writer-home',
    skillId: 'seo-content-writer',
    title: 'Write an SEO blog post',
    shortLabel: 'SEO post',
    icon: 'pen-nib',
    promptTemplate: 'Write an SEO-optimized blog post on: {input}',
    surfaces: ['home', 'desktop'],
    order: 5,
  },
  {
    id: 'competitor-watch-home',
    skillId: 'competitor-watch',
    title: 'Watch a competitor',
    shortLabel: 'Watch',
    icon: 'binoculars',
    promptTemplate: 'Set up a weekly competitor watch on {input}. Diff each run and post a digest.',
    surfaces: ['home', 'desktop'],
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

/** Look up the skill metadata referenced by a use case. */
export function getSkillForUseCase(useCase: UseCase): SkillMetadata | undefined {
  return SKILL_METADATA.find((s) => s.id === useCase.skillId)
}
