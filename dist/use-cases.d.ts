/**
 * @duet/skills/use-cases
 *
 * Metadata-only view of skills + the curated list of surface placements.
 * Safe to import from the web — prompt bodies are stripped.
 */
import type { SkillMetadata, UseCase } from './types.js';
export type { SkillMetadata, UseCase, Surface } from './types.js';
export { KNOWN_DEFAULT_SKILL_IDS, isKnownDefaultSkillId } from './external-skills.js';
export type { KnownDefaultSkillId } from './external-skills.js';
export declare const SKILL_METADATA: readonly SkillMetadata[];
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
 * The `deep-research` skill below appears twice with different framings —
 * that's the "one skill, two surfaces" pattern. The skill is unchanged;
 * only the title, label, and prompt template differ.
 */
export declare const USE_CASES: readonly UseCase[];
/** Look up use cases by surface. Returns them sorted by `order` then array position. */
export declare function getUseCasesForSurface(surface: UseCase['surfaces'][number]): readonly UseCase[];
/**
 * Look up the skill metadata referenced by a use case **from this package**.
 *
 * Returns `undefined` if the `skillId` references an external default skill
 * (one of `KNOWN_DEFAULT_SKILL_IDS`). The caller is responsible for
 * resolving external ids against chat-app's default-skill metadata.
 */
export declare function getSkillForUseCase(useCase: UseCase): SkillMetadata | undefined;
/** Look up a use case by id. */
export declare function getUseCaseById(id: string): UseCase | undefined;
//# sourceMappingURL=use-cases.d.ts.map