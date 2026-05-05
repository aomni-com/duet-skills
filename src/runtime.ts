/**
 * @duet/skills/runtime
 *
 * Full registry including each skill's prompt body. Imported by the sandbox
 * at boot. Do NOT import this from the web — use `@duet/skills/use-cases`
 * for browser-safe metadata.
 */

import type { Skill } from './types.js'
import { SKILLS } from './generated.js'

export type { Skill, SkillMetadata, UseCase, Surface, ForbiddenOnUseCase } from './types.js'
export { KNOWN_DEFAULT_SKILL_IDS, isKnownDefaultSkillId } from './external-skills.js'
export type { KnownDefaultSkillId } from './external-skills.js'

export { SKILLS }

/** Look up a skill by id. Returns undefined if not found. */
export function getSkill(id: string): Skill | undefined {
  return SKILLS.find((s) => s.id === id)
}

/** Returns true if a skill with the given id exists. */
export function hasSkill(id: string): boolean {
  return SKILLS.some((s) => s.id === id)
}

/** All registered skill ids, useful for validation and diagnostics. */
export const SKILL_IDS: readonly string[] = SKILLS.map((s) => s.id)
