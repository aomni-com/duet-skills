/**
 * Core types for the @duet/skills registry.
 *
 * The split between Skill (capability) and UseCase (curation) is intentional
 * and load-bearing. Use cases reference skills by `skillId`. Use cases must
 * never carry behavior overrides — this is enforced by the type system below.
 */

/**
 * A capability the sandbox can perform. Authored as `skills/<id>/SKILL.md`.
 * The full Skill (including `body`) is exposed by `@duet/skills/runtime` and
 * loaded by the sandbox at boot. The web only sees `SkillMetadata`.
 */
export interface Skill {
  /** Stable identifier. Never rename — only deprecate. */
  readonly id: string
  /** Human-readable name shown in surfaces. */
  readonly name: string
  /** Short description used for tooltips, marketing, and AI triggering. */
  readonly description: string
  /** Optional override for the model the skill should run on. */
  readonly model?: string
  /** Optional list of tool ids the skill expects to have access to. */
  readonly tools?: readonly string[]
  /** Markdown body of SKILL.md (everything after the frontmatter). */
  readonly body: string
}

/** Metadata-only view of a skill. Safe to ship to the browser. */
export type SkillMetadata = Omit<Skill, 'body'>

/** Surfaces a use case can render on. Extend as new surfaces ship. */
export type Surface = 'home' | 'desktop' | 'mobile' | 'channel' | 'compose'

/**
 * A use case is a placement of a skill on a surface. It carries no behavior
 * overrides — it cannot change which model runs, which tools are allowed, or
 * the system prompt. Curation only.
 */
export interface UseCase {
  /** Unique id for this placement. Distinct from skillId. */
  readonly id: string
  /** Must reference an existing Skill.id. Verified at build time. */
  readonly skillId: string
  /** Title rendered on the surface. */
  readonly title: string
  /** Optional short label for compact surfaces (chips, mobile). */
  readonly shortLabel?: string
  /** Optional icon name (Phosphor or surface-specific). */
  readonly icon?: string
  /**
   * Prefilled prompt for this surface. `{input}` is the substitution token
   * for whatever the user enters in the compose bar.
   */
  readonly promptTemplate: string
  /** Where this use case appears. */
  readonly surfaces: readonly Surface[]
  /** Sort order within a surface (ascending). */
  readonly order?: number
}

/**
 * Compile-time guard: a UseCase must NOT carry these fields. If you ever see a
 * type error pointing here, someone tried to add behavior to a use case.
 * Move that behavior into the Skill instead.
 */
export type ForbiddenOnUseCase = 'systemPrompt' | 'tools' | 'model' | 'body'
type _AssertNoOverrides = ForbiddenOnUseCase extends keyof UseCase ? never : true
const _assertNoOverrides: _AssertNoOverrides = true
void _assertNoOverrides
