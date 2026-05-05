/**
 * @duet/skills/use-cases
 *
 * Metadata-only view of skills + the curated list of surface placements.
 * Safe to import from the web — prompt bodies are stripped.
 */
import type { SkillMetadata, UseCase } from './types.js';
export type { SkillMetadata, UseCase, Surface } from './types.js';
export declare const SKILL_METADATA: readonly SkillMetadata[];
/**
 * The curated list of use cases. Order within a surface is determined by
 * `order` (ascending), then by array position.
 *
 * Invariants enforced at build time:
 * - Every `skillId` references a real Skill.id (build-registry checks this).
 * - No behavior overrides — see `ForbiddenOnUseCase` in types.ts.
 *
 * Note the `outbound-campaign` skill below appears twice with different
 * framings — that's the "one skill, two surfaces" pattern. The skill is
 * unchanged; only the title, label, and prompt template differ.
 */
export declare const USE_CASES: readonly UseCase[];
/** Look up use cases by surface. Returns them sorted by `order` then array position. */
export declare function getUseCasesForSurface(surface: UseCase['surfaces'][number]): readonly UseCase[];
/** Look up the skill metadata referenced by a use case. */
export declare function getSkillForUseCase(useCase: UseCase): SkillMetadata | undefined;
/** Look up a use case by id. */
export declare function getUseCaseById(id: string): UseCase | undefined;
//# sourceMappingURL=use-cases.d.ts.map