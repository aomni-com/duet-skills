/**
 * Core types for the @duet/skills registry.
 *
 * The split between Skill (capability) and UseCase (curation) is intentional
 * and load-bearing. Use cases reference skills by `skillId`. Use cases must
 * never carry behavior overrides — this is enforced by the type system below.
 */
const _assertNoOverrides = true;
void _assertNoOverrides;
export {};
//# sourceMappingURL=types.js.map