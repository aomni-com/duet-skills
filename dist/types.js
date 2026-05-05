/**
 * Core types for the @aomni-com/duet-skills registry.
 *
 * The split between Skill (capability) and UseCase (curation) is intentional
 * and load-bearing. Use cases reference skills by id. Use cases must never
 * carry behavior overrides — this is enforced by the type system below.
 */
export const DELIVERABLE_LABELS = {
    app: 'App',
    automation: 'Automation',
    recurring: 'Recurring report',
    workflow: 'Workflow',
};
export const CATEGORY_LABELS = {
    engineering: 'Engineering',
    growth: 'Growth & GTM',
    content: 'Content & marketing',
    sales: 'Sales & customer success',
    operations: 'Operations',
    research: 'Research & strategy',
    'internal-tools': 'Internal tools & apps',
    personal: 'Personal assistant',
};
const _assertNoOverrides = true;
void _assertNoOverrides;
//# sourceMappingURL=types.js.map