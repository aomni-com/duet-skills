/**
 * @aomni-com/duet-skills/use-cases
 *
 * Metadata-only view of skills + the curated list of surface placements.
 * Safe to import from the web — prompt bodies are stripped.
 *
 * Use cases here are the canonical source of truth for the home tab
 * "Suggested for you" preview banner and the workflow dialog. Each one
 * references skills by id — either a local skill (authored in this repo)
 * or a chat-app default skill (listed in `KNOWN_DEFAULT_SKILL_IDS`).
 */
import type { SkillMetadata, UseCase, UseCaseCategory } from './types.js';
export type { SkillMetadata, UseCase, UseCaseCategory, UseCaseDeliverable, UseCaseNode, ToolkitRequirement, Surface, } from './types.js';
export { CATEGORY_LABELS, DELIVERABLE_LABELS } from './types.js';
export { KNOWN_DEFAULT_SKILL_IDS, isKnownDefaultSkillId } from './external-skills.js';
export type { KnownDefaultSkillId } from './external-skills.js';
export declare const SKILL_METADATA: readonly SkillMetadata[];
/**
 * The canonical use case registry. Migrated from the chat-app workflow catalog
 * with `primarySkillId` + `supportingSkillIds` added. Every skill id resolves
 * to a real local skill or a known default skill — verified by build-registry.
 */
export declare const USE_CASES: readonly UseCase[];
/** Look up use cases by surface. Returns them sorted by `order` then array position. */
export declare function getUseCasesForSurface(surface: UseCase['surfaces'][number]): readonly UseCase[];
/** Look up a use case by id. */
export declare function getUseCaseById(id: string | null | undefined): UseCase | undefined;
/**
 * Look up the local skill metadata referenced as `primarySkillId` for a use case.
 * Returns `undefined` if the primary id references a chat-app default skill —
 * the caller should resolve those against chat-app's own metadata.
 */
export declare function getSkillForUseCase(useCase: UseCase): SkillMetadata | undefined;
/** All `primarySkillId` + `supportingSkillIds` for a use case as a flat array. */
export declare function getAllSkillIdsForUseCase(useCase: UseCase): readonly string[];
/**
 * Returns the full catalog ordered with the user's category first, then the
 * remaining use cases grouped by their categories in a sensible order.
 */
export declare function getOrderedUseCases(preferredCategory: UseCaseCategory): readonly UseCase[];
export declare function resolveUseCaseCategoryFromRole(signal: string | undefined | null): UseCaseCategory;
//# sourceMappingURL=use-cases.d.ts.map