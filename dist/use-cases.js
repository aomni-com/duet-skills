/**
 * @duet/skills/use-cases
 *
 * Metadata-only view of skills + the curated list of surface placements.
 * Safe to import from the web — prompt bodies are stripped.
 */
import { SKILLS } from './generated.js';
export { KNOWN_DEFAULT_SKILL_IDS, isKnownDefaultSkillId } from './external-skills.js';
/** Strip prompt bodies. The result is browser-safe. */
const stripBody = (s) => {
    const { body: _body, ...rest } = s;
    return rest;
};
export const SKILL_METADATA = SKILLS.map(stripBody);
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
export const USE_CASES = [
    // Research
    {
        id: 'deep-research-home',
        skillId: 'deep-research',
        title: 'Deep research',
        shortLabel: 'Research',
        icon: 'magnifying-glass',
        promptTemplate: 'Do deep research on: {input}',
        surfaces: ['home', 'desktop'],
        order: 0,
    },
    {
        id: 'deep-research-company',
        skillId: 'deep-research',
        title: 'Research a company',
        shortLabel: 'Company',
        icon: 'building',
        promptTemplate: 'Research the company {input} — products, customers, recent news, competitive landscape.',
        surfaces: ['home'],
        order: 0,
    },
    // Sales & GTM
    {
        id: 'sales-meeting-prep-home',
        skillId: 'sales-meeting-prep',
        title: 'Prep my next meeting',
        shortLabel: 'Meeting prep',
        icon: 'calendar',
        promptTemplate: 'Prep me for my next meeting. Pull the calendar event, enrich attendees, and draft a briefing.',
        surfaces: ['home', 'desktop'],
        order: 1,
    },
    {
        id: 'outbound-campaign-home',
        skillId: 'outbound-campaign',
        title: 'Run an outbound campaign',
        shortLabel: 'Outbound',
        icon: 'paper-plane-tilt',
        promptTemplate: 'Run an outbound campaign for: {input}',
        surfaces: ['home', 'desktop'],
        order: 2,
    },
    {
        id: 'outbound-campaign-reactivate',
        skillId: 'outbound-campaign',
        title: 'Reactivate dormant leads',
        shortLabel: 'Reactivate',
        icon: 'arrows-clockwise',
        promptTemplate: 'Build a reactivation sequence for dormant leads in: {input}',
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
    // Content & Marketing
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
        id: 'marketing-video-home',
        skillId: 'marketing-video',
        title: 'Make a marketing video',
        shortLabel: 'Video',
        icon: 'film-strip',
        promptTemplate: 'Make a marketing video for: {input}. Render 16:9 and 9:16 cuts with captions.',
        surfaces: ['home', 'desktop'],
        order: 6,
    },
    {
        id: 'branded-asset-generator-home',
        skillId: 'branded-asset-generator',
        title: 'Generate branded assets',
        shortLabel: 'Branded set',
        icon: 'palette',
        promptTemplate: 'Generate a branded asset set for: {input}',
        surfaces: ['home', 'desktop'],
        order: 7,
    },
    // Operations
    {
        id: 'support-ticket-triage-home',
        skillId: 'support-ticket-triage',
        title: 'Triage support tickets',
        shortLabel: 'Support',
        icon: 'lifebuoy',
        promptTemplate: 'Triage the open support queue and draft replies where you can.',
        surfaces: ['home', 'desktop'],
        order: 8,
    },
    {
        id: 'competitor-watch-home',
        skillId: 'competitor-watch',
        title: 'Watch a competitor',
        shortLabel: 'Watch',
        icon: 'binoculars',
        promptTemplate: 'Set up a weekly competitor watch on {input}. Diff each run and post a digest.',
        surfaces: ['home', 'desktop'],
        order: 9,
    },
    // Build & Data
    {
        id: 'cross-source-dashboard-home',
        skillId: 'cross-source-dashboard',
        title: 'Build a dashboard',
        shortLabel: 'Dashboard',
        icon: 'chart-line',
        promptTemplate: 'Build a live dashboard pulling from: {input}. Deploy to a permission-restricted URL.',
        surfaces: ['home', 'desktop'],
        order: 10,
    },
    {
        id: 'internal-tracker-app-home',
        skillId: 'internal-tracker-app',
        title: 'Build a tracker app',
        shortLabel: 'Tracker',
        icon: 'table',
        promptTemplate: 'Build an internal tracker for: {input}. Typed columns, multiple tabs, shareable URL.',
        surfaces: ['home', 'desktop'],
        order: 11,
    },
    {
        id: 'scheduled-pipeline-home',
        skillId: 'scheduled-pipeline',
        title: 'Schedule a data pipeline',
        shortLabel: 'Pipeline',
        icon: 'clock-counter-clockwise',
        promptTemplate: 'Set up a scheduled pipeline for: {input}',
        surfaces: ['home', 'desktop'],
        order: 12,
    },
    // External (chat-app default skills) — demonstrate the cross-repo pattern
    {
        id: 'firecrawl-home',
        skillId: 'firecrawl',
        title: 'Scrape a webpage',
        shortLabel: 'Scrape',
        icon: 'globe',
        promptTemplate: 'Scrape this URL and return clean markdown: {input}',
        surfaces: ['home', 'desktop'],
        order: 14,
    },
    {
        id: 'pdf-extract-home',
        skillId: 'pdf',
        title: 'Extract from a PDF',
        shortLabel: 'PDF extract',
        icon: 'file-pdf',
        promptTemplate: 'Extract the text and tables from the attached PDF.',
        surfaces: ['home', 'desktop'],
        order: 15,
    },
    {
        id: 'file-conversion-home',
        skillId: 'file-conversion',
        title: 'Convert a file',
        shortLabel: 'Convert',
        icon: 'arrows-clockwise',
        promptTemplate: 'Convert the attached file to: {input}',
        surfaces: ['home', 'desktop'],
        order: 16,
    },
    // Personal / team
    {
        id: 'meeting-notes-to-actions-home',
        skillId: 'meeting-notes-to-actions',
        title: 'Turn meeting notes into actions',
        shortLabel: 'Notes → actions',
        icon: 'check-square',
        promptTemplate: 'Take the attached meeting notes and turn them into a summary, decisions, and assigned action items.',
        surfaces: ['home', 'desktop'],
        order: 13,
    },
];
/** Look up use cases by surface. Returns them sorted by `order` then array position. */
export function getUseCasesForSurface(surface) {
    return USE_CASES.filter((u) => u.surfaces.includes(surface)).slice().sort((a, b) => {
        const ao = a.order ?? Number.POSITIVE_INFINITY;
        const bo = b.order ?? Number.POSITIVE_INFINITY;
        return ao - bo;
    });
}
/**
 * Look up the skill metadata referenced by a use case **from this package**.
 *
 * Returns `undefined` if the `skillId` references an external default skill
 * (one of `KNOWN_DEFAULT_SKILL_IDS`). The caller is responsible for
 * resolving external ids against chat-app's default-skill metadata.
 */
export function getSkillForUseCase(useCase) {
    return SKILL_METADATA.find((s) => s.id === useCase.skillId);
}
/** Look up a use case by id. */
export function getUseCaseById(id) {
    return USE_CASES.find((u) => u.id === id);
}
//# sourceMappingURL=use-cases.js.map