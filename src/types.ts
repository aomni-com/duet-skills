/**
 * Core types for the @aomni-com/duet-skills registry.
 *
 * The split between Skill (capability) and UseCase (curation) is intentional
 * and load-bearing. Use cases reference skills by id. Use cases must never
 * carry behavior overrides — this is enforced by the type system below.
 */

/**
 * A capability the sandbox can perform. Authored as `skills/<id>/SKILL.md`.
 * The full Skill (including `body`) is exposed by `@aomni-com/duet-skills/runtime`
 * and loaded by the sandbox at boot. The web only sees `SkillMetadata`.
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
 * Category buckets for grouping use cases on the dialog grid and for
 * persona-driven ordering.
 */
export type UseCaseCategory =
  | 'engineering'
  | 'growth'
  | 'content'
  | 'sales'
  | 'operations'
  | 'research'
  | 'internal-tools'
  | 'personal'

/** Shape of the thing Duet builds for the user. Drives the badge in the UI. */
export type UseCaseDeliverable = 'app' | 'automation' | 'recurring' | 'workflow'

export const DELIVERABLE_LABELS: Record<UseCaseDeliverable, string> = {
  app: 'App',
  automation: 'Automation',
  recurring: 'Recurring report',
  workflow: 'Workflow',
}

export const CATEGORY_LABELS: Record<UseCaseCategory, string> = {
  engineering: 'Engineering',
  growth: 'Growth & GTM',
  content: 'Content & marketing',
  sales: 'Sales & customer success',
  operations: 'Operations',
  research: 'Research & strategy',
  'internal-tools': 'Internal tools & apps',
  personal: 'Personal assistant',
}

/** A node in the source → duet → output workflow diagram. */
export interface UseCaseNode {
  /** Short label shown under the node. */
  readonly label: string
  /** Phosphor icon name (kebab-case). Resolved to a component by the consumer. */
  readonly icon: string
  /** Visual tone the surface uses to style the node. */
  readonly tone: 'source' | 'duet' | 'output'
  /** Optional Composio toolkit slug — when set, surfaces show the brand icon. */
  readonly brandSlug?: string
}

/** Composio toolkit prerequisite for a use case. */
export interface ToolkitRequirement {
  /** Composio toolkit slug (lowercase). Matches `slug` from listConnectedToolkits. */
  readonly slug: string
  /** Human-readable label shown when the toolkit is missing. */
  readonly label: string
}

/**
 * A use case is a placement of a skill on a surface, plus the rich metadata
 * surfaces use to render it (workflow diagram, deliverable badge, expectation
 * bullets, seed prompt). It carries no behavior overrides — it cannot change
 * which model runs, which tools are allowed, or the system prompt. Curation
 * only.
 */
export interface UseCase {
  /** Unique id for this use case. */
  readonly id: string
  /** Category bucket — drives grouping and persona-based ordering. */
  readonly category: UseCaseCategory
  /** Title rendered on the surface. */
  readonly title: string
  /** One-line subtitle shown under the title in cards / dialog. */
  readonly subtitle: string
  /** Optional shorter label for compact surfaces (chips, mobile). */
  readonly shortLabel?: string
  /** Optional Phosphor icon name override for the preview card. */
  readonly cardIcon?: string
  /** Diagram nodes: source → duet → output. Always exactly 3. */
  readonly nodes: readonly [UseCaseNode, UseCaseNode, UseCaseNode]
  /** What kind of artifact Duet ends up building — surfaces as a badge. */
  readonly deliverable: UseCaseDeliverable
  /** Toolkits that must be connected before the use case can run end-to-end. */
  readonly requiredToolkits: readonly ToolkitRequirement[]
  /** Concrete bullets shown in the details view. */
  readonly whatYoullGet: readonly string[]
  /** Preview of the questions Duet will ask first. Sets expectations. */
  readonly whatIllAsk: readonly string[]
  /** Detailed prompt sent to Duet on launch. Should be explicit about deliverable. */
  readonly seedPrompt: string
  /**
   * The skill the runtime should preference for this use case. Resolves to
   * either a local skill (`SKILL_METADATA`) or a chat-app default skill
   * (`KNOWN_DEFAULT_SKILL_IDS`). Required.
   */
  readonly primarySkillId: string
  /**
   * Additional skills the use case can engage. Optional. Same resolution rules
   * as `primarySkillId`. The runtime advertises these as additional context.
   */
  readonly supportingSkillIds?: readonly string[]
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
