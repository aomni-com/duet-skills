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
import { CATEGORY_LABELS } from './types.js';
import { SKILLS } from './generated.js';
export { CATEGORY_LABELS, DELIVERABLE_LABELS } from './types.js';
export { KNOWN_DEFAULT_SKILL_IDS, isKnownDefaultSkillId } from './external-skills.js';
/** Strip prompt bodies. The result is browser-safe. */
const stripBody = (s) => {
    const { body: _body, ...rest } = s;
    return rest;
};
export const SKILL_METADATA = SKILLS.map(stripBody);
const DUET_NODE = { label: 'Duet', icon: 'sparkle', tone: 'duet' };
/**
 * The canonical use case registry. Migrated from the chat-app workflow catalog
 * with `primarySkillId` + `supportingSkillIds` added. Every skill id resolves
 * to a real local skill or a known default skill — verified by build-registry.
 */
export const USE_CASES = [
    /* ──────────────────────────── Engineering ─────────────────────────── */
    {
        id: 'eng-sentry-pr',
        category: 'engineering',
        title: 'Turn Sentry crashes into fix PRs',
        subtitle: 'When an error lands, I diagnose it and open a pull request.',
        nodes: [
            { label: 'Sentry', icon: 'bug-beetle', tone: 'source', brandSlug: 'sentry' },
            DUET_NODE,
            { label: 'GitHub PR', icon: 'git-pull-request', tone: 'output', brandSlug: 'github' },
        ],
        deliverable: 'automation',
        requiredToolkits: [
            { slug: 'sentry', label: 'Sentry' },
            { slug: 'github', label: 'GitHub' },
        ],
        whatYoullGet: [
            'A live monitor on your Sentry project',
            'Root-cause analysis written from the stack trace + relevant code',
            'A drafted pull request on your repo with a suggested fix',
            'A summary of the issue and fix posted back into this channel',
        ],
        whatIllAsk: [
            'Which Sentry project to watch',
            'Which GitHub repo and default branch to target',
            'Whether to auto-open the PR or just draft it for review',
        ],
        seedPrompt: "Set up a Sentry crash → auto-diagnosed fix PR automation. When a new Sentry issue fires, fetch the stack trace and relevant code, diagnose the most likely root cause, open a draft pull request on the repo I specify with the suggested fix and a clear explanation, and post a short summary back into this channel. Start by asking me: which Sentry project to watch, which GitHub repo + default branch, and whether the PR should auto-open or just draft. Then configure it end-to-end and confirm it's live.",
        primarySkillId: 'github',
        supportingSkillIds: ['composio-credentials', 'webhook-collector'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'eng-dev-loop',
        category: 'engineering',
        title: 'Ship features straight from a spec',
        subtitle: 'Full dev loop in-channel — write a spec, get working code.',
        nodes: [
            { label: 'Spec', icon: 'note-pencil', tone: 'source' },
            DUET_NODE,
            { label: 'GitHub PR', icon: 'git-pull-request', tone: 'output', brandSlug: 'github' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [{ slug: 'github', label: 'GitHub' }],
        whatYoullGet: [
            'A repeatable in-channel dev loop: paste a spec, get a working PR',
            'Scaffolded files with tests where the codebase already has them',
            'Self-review notes on edge cases and trade-offs in the PR description',
            'A clear path from "idea" to "merged" without leaving the chat',
        ],
        whatIllAsk: [
            'Which GitHub repo and base branch to target',
            'Conventions to follow (test framework, lint rules, file layout)',
            'Whether you want PRs as draft or ready-for-review by default',
        ],
        seedPrompt: "Set me up with an in-channel dev loop. When I paste a spec, you should: (1) restate it in your own words and ask any clarifying questions, (2) scaffold the files and tests on a new branch, (3) push and open a PR with a self-review of edge cases and trade-offs, and (4) iterate on review comments until merged. Start by asking which GitHub repo and base branch, the codebase's testing/lint conventions, and whether I want PRs as draft or ready-for-review by default.",
        primarySkillId: 'github',
        supportingSkillIds: ['build-apps'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'eng-monitors',
        category: 'engineering',
        title: 'Build a stack health dashboard',
        subtitle: 'A live view of uptime, spend, and staging — refreshed in the background.',
        nodes: [
            { label: 'Schedule', icon: 'calendar', tone: 'source' },
            DUET_NODE,
            { label: 'Report', icon: 'chart-line', tone: 'output' },
        ],
        deliverable: 'app',
        requiredToolkits: [],
        whatYoullGet: [
            'A hosted dashboard at a shareable URL',
            'Panels for the systems I name (uptime, spend, staging health)',
            'Background refresh so the data is always fresh',
            'Threshold-based highlights when something crosses a line',
        ],
        whatIllAsk: [
            'Which systems to monitor (production URLs, gateway dashboards, etc.)',
            'How often each panel should refresh and what thresholds matter',
            'Where to post a heads-up if a threshold is crossed',
        ],
        seedPrompt: 'Build a stack health dashboard as a hosted app. The app should pull from the systems I name (uptime, gateway spend, staging health), display them as panels with background refresh, and highlight anything past a threshold. Also post a heads-up into this channel when a threshold trips. Start by asking: which systems to monitor, the refresh cadence + thresholds, and where to send heads-ups. Then build and deploy it, and share the URL.',
        primarySkillId: 'cross-source-dashboard',
        supportingSkillIds: ['build-apps', 'cron', 'composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'eng-internal-admin',
        category: 'engineering',
        title: 'Build an internal admin app',
        subtitle: 'Server file browser, terminal, reboot — without an SRE call.',
        nodes: [
            { label: 'Sandbox', icon: 'terminal-window', tone: 'source' },
            DUET_NODE,
            { label: 'Admin app', icon: 'browser', tone: 'output' },
        ],
        deliverable: 'app',
        requiredToolkits: [],
        whatYoullGet: [
            'A real internal-admin app with a file browser for your sandbox',
            'A web terminal that runs commands and streams output',
            'Buttons for common ops (reboot, clear cache, redeploy)',
            'Permission-gated URL so only your team can reach it',
        ],
        whatIllAsk: [
            'Which sandbox / server should the tools target',
            'Which actions you most often need (reboot, file edit, run script, etc.)',
            'Who should have access (specific emails or workspace-wide)',
        ],
        seedPrompt: 'Build an internal admin tools app for me. The app should include a file browser scoped to my sandbox, a streaming web terminal, and buttons for common ops actions (reboot, clear cache, redeploy). Gate access by email or workspace. Start by asking: which sandbox/server the tools should target, the top three actions I run most often, and who should have access. Then build it, deploy it, and share the URL.',
        primarySkillId: 'build-apps',
        supportingSkillIds: ['internal-tracker-app'],
        surfaces: ['home', 'desktop'],
    },
    /* ──────────────────────────── Growth / GTM ─────────────────────────── */
    {
        id: 'growth-email-triage',
        category: 'growth',
        title: 'Triage email and draft replies',
        subtitle: 'Inbound replies drafted in your voice, ready to send.',
        nodes: [
            { label: 'Gmail', icon: 'envelope', tone: 'source', brandSlug: 'gmail' },
            DUET_NODE,
            { label: 'Drafts', icon: 'note-pencil', tone: 'output', brandSlug: 'gmail' },
        ],
        deliverable: 'automation',
        requiredToolkits: [{ slug: 'gmail', label: 'Gmail' }],
        whatYoullGet: [
            'Auto-triage on incoming threads: hot, warm, ignore',
            'Personalized draft replies in your voice — never auto-sent',
            'A short rationale beside each draft so you know why it was written that way',
            'A digest of what was triaged each morning',
        ],
        whatIllAsk: [
            'Which inbox label or filter defines "needs triage"',
            'Examples of how you usually reply (tone, length, signoff)',
            'Which categories should never get a draft (e.g. legal, billing)',
        ],
        seedPrompt: 'Set up email triage with personalized drafted replies. Watch the inbox label I name, sort each new thread into hot/warm/ignore, and for hot/warm threads draft a reply in my voice with a short rationale. Never auto-send — always leave the draft for me. Also send me a daily morning digest of what was triaged. Start by asking: which label/filter to watch, examples of how I usually reply (tone, length, signoff), and which categories should never get a draft.',
        primarySkillId: 'email-triage',
        supportingSkillIds: ['composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'growth-outbound-sequence',
        category: 'growth',
        title: 'Personalized outbound from a lead list',
        subtitle: 'Drafts in your voice, sent through your Gmail, with a Calendly link inside.',
        nodes: [
            { label: 'Leads', icon: 'users-three', tone: 'source' },
            DUET_NODE,
            { label: 'Calendly', icon: 'calendar', tone: 'output', brandSlug: 'calendly' },
        ],
        deliverable: 'automation',
        requiredToolkits: [
            { slug: 'gmail', label: 'Gmail' },
            { slug: 'calendly', label: 'Calendly' },
        ],
        whatYoullGet: [
            'Enriched profile data on each lead (role, company, recent signals)',
            'A multi-step outbound sequence personalized per lead',
            'Calendly link inserted at the right moment in the thread',
            'A pipeline view of who replied, who booked, who went cold',
        ],
        whatIllAsk: [
            'Where the lead list lives (sheet, CRM, or paste)',
            'What you sell and the ICP you want to reach',
            'Sequence cadence + when to insert the Calendly link',
        ],
        seedPrompt: 'Build a lead enrichment → outbound → Calendly booking automation. For each lead in the list I provide, enrich with role + company + recent signals, run a personalized multi-step outbound sequence, and insert a Calendly link at the right moment. Track replies, bookings, and cold leads in a pipeline view I can open. Start by asking: where the lead list lives, what I sell + my ICP, the sequence cadence, and when to drop the Calendly link.',
        primarySkillId: 'outbound-campaign',
        supportingSkillIds: ['go-to-market', 'composio-credentials', 'crm'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'growth-weekly-intel',
        category: 'growth',
        title: 'Weekly competitor and SEO digest',
        subtitle: 'Every week, a roundup of what moved and why.',
        nodes: [
            { label: 'Market', icon: 'shopping-bag', tone: 'source' },
            DUET_NODE,
            { label: 'Brief', icon: 'newspaper', tone: 'output' },
        ],
        deliverable: 'recurring',
        requiredToolkits: [],
        whatYoullGet: [
            'A weekly intel roundup posted into this channel',
            'Competitor moves: pricing, messaging, product launches',
            'SEO movement on the keywords you care about',
            'Growth signals: hiring, funding, headcount changes',
        ],
        whatIllAsk: [
            'Which competitors and keywords to watch',
            'Day and time for the roundup',
            'How long the brief should be (skim / detailed)',
        ],
        seedPrompt: 'Set up a weekly competitive + SEO + growth report as a recurring brief. Each week post into this channel: competitor moves (pricing, messaging, launches), SEO movement on my keywords, and growth signals (hiring, funding, headcount). Start by asking: which competitors and keywords to watch, the day + time for posting, and whether I want a skim version or a detailed read. Then schedule it and confirm.',
        primarySkillId: 'competitor-watch',
        supportingSkillIds: ['go-to-market', 'firecrawl', 'cron'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'growth-landing-ab',
        category: 'growth',
        title: 'Generate landing page and ad variants',
        subtitle: 'Multiple on-brand copy + creative variants from a single brief.',
        nodes: [
            { label: 'Brief', icon: 'note-pencil', tone: 'source' },
            DUET_NODE,
            { label: 'Variants', icon: 'browser', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [],
        whatYoullGet: [
            'Multiple landing page + ad copy variants per round',
            'A/B test plans with hypothesis, metric, and minimum sample size',
            'A scorecard after each round: what worked, what to try next',
            'Living doc of winners you can lift back into production',
        ],
        whatIllAsk: [
            'Current landing URL and the page or ad we are iterating on',
            'The metric we are trying to move (CVR, CTR, signup)',
            'Voice / messaging guardrails I should never break',
        ],
        seedPrompt: 'Run a landing page + ad copy A/B iteration loop. Each round, generate 3–5 distinct variants with a hypothesis and target metric, write the test plan with sample size, then after results come in produce a scorecard and the next round. Keep a living doc of winning copy I can lift into prod. Start by asking: the current landing URL or ad, the metric we are moving, and any voice guardrails.',
        primarySkillId: 'branded-asset-generator',
        supportingSkillIds: ['branded-content', 'seo-content-writer', 'media-creation'],
        surfaces: ['home', 'desktop'],
    },
    /* ──────────────────────────── Content / Marketing ─────────────────────────── */
    {
        id: 'content-seo-posts',
        category: 'content',
        title: 'Write SEO blog posts that rank',
        subtitle: 'AI-citable, title-optimized, ready to publish.',
        nodes: [
            { label: 'Topic', icon: 'book-open-text', tone: 'source' },
            DUET_NODE,
            { label: 'Article', icon: 'newspaper', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [],
        whatYoullGet: [
            'Long-form drafts (1500–3000 words) with proper structure',
            'Title + meta optimized for click-through and AI citation',
            'Internal links and source citations baked in',
            'A simple publish step (Markdown, MDX, or your CMS)',
        ],
        whatIllAsk: [
            'Site URL and topics / keywords to cover',
            'Voice and example posts that already perform well',
            'Where to ship the final draft (file path, CMS, or Notion)',
        ],
        seedPrompt: 'Set me up to produce long-form SEO blog posts and guides on demand. Each piece should be 1500–3000 words, properly structured, with title + meta optimized for click-through and AI citation, internal links, and source citations. Ship the final to my CMS / repo / Notion (whichever I name). Start by asking: site URL, topics + keywords, voice + example posts that perform well, and where to publish.',
        primarySkillId: 'seo-content-writer',
        supportingSkillIds: ['firecrawl', 'go-to-market'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'content-creative',
        category: 'content',
        title: 'Generate on-brand visuals and ads',
        subtitle: 'On-brand visuals at the speed of typing.',
        nodes: [
            { label: 'Brief', icon: 'note-pencil', tone: 'source' },
            DUET_NODE,
            { label: 'Image', icon: 'image', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [],
        whatYoullGet: [
            'On-brand infographics, social cards, and ad creative',
            'Multiple variants per brief so you can pick + iterate',
            'Brand assets (colors, fonts, marks) reused automatically',
            'Export-ready files in the sizes the platforms want',
        ],
        whatIllAsk: [
            'Brand colors, fonts, and any logo files to use',
            'The platform sizes you need (IG, X, LinkedIn, ad networks)',
            'Where to drop the finished assets',
        ],
        seedPrompt: 'Set up on-demand creative generation for infographics and ad creative. From a short brief, produce 3–5 on-brand variants in the platform sizes I need, using my brand colors / fonts / marks consistently. Save export-ready files to the location I name. Start by asking: brand colors + fonts + logo, platform sizes (IG / X / LinkedIn / ads), and where to drop the finished files.',
        primarySkillId: 'branded-asset-generator',
        supportingSkillIds: ['branded-content', 'media-creation'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'content-video-series',
        category: 'content',
        title: 'Plan a short-form video series',
        subtitle: 'Hooks, scripts, shot lists, and storyboard images — ready to film.',
        cardIcon: 'film-strip',
        nodes: [
            { label: 'Theme', icon: 'note-pencil', tone: 'source' },
            DUET_NODE,
            { label: 'Storyboard', icon: 'film-strip', tone: 'output' },
        ],
        deliverable: 'recurring',
        requiredToolkits: [],
        whatYoullGet: [
            'A recurring slate of short-form video ideas in your style',
            'Per episode: hook, script, beat-by-beat shot list, captions',
            'Optional storyboards via image gen for the visual beats',
            'A backlog you can pull from whenever you want to film',
        ],
        whatIllAsk: [
            'The series theme + voice (mockumentary, demo, talking head, etc.)',
            'Length and posting cadence',
            'Examples of videos that already worked for you',
        ],
        seedPrompt: 'Build a short-form video series workflow. On a recurring schedule, produce a slate of episodes — each with a hook, script, beat-by-beat shot list, captions, and optional storyboard images. Keep a running backlog I can pull from. Start by asking: the series theme + voice, episode length + cadence, and example videos that already performed.',
        primarySkillId: 'marketing-video',
        supportingSkillIds: ['media-creation', 'branded-content'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'content-decks',
        category: 'content',
        title: 'Generate decks, PDFs and one-pagers',
        subtitle: 'Investor decks, sales sheets, and PDFs from a brief — on-brand.',
        cardIcon: 'presentation',
        nodes: [
            { label: 'Brief', icon: 'note-pencil', tone: 'source' },
            DUET_NODE,
            { label: 'Doc', icon: 'presentation', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [],
        whatYoullGet: [
            'Branded decks, PDFs, and one-pagers from a one-line brief',
            'Real layouts (not bullet salad) — investor, sales, internal',
            'Brand-consistent type, color, and image treatment',
            'Editable source files plus a polished export',
        ],
        whatIllAsk: [
            'Brand assets (colors, fonts, logos) and reference docs you like',
            'The deck/doc archetypes you produce most often',
            'Where to save the final files',
        ],
        seedPrompt: 'Set up branded deck + PDF + one-pager generation on demand. From a brief, produce a polished doc using my brand assets (colors, fonts, logos) with a real layout — not just bullet points. Output editable source plus a polished export. Start by asking: brand assets, the doc archetypes I make most often (investor / sales / internal / etc.), and where to save the finals.',
        primarySkillId: 'branded-asset-generator',
        supportingSkillIds: ['branded-content', 'pdf', 'media-creation'],
        surfaces: ['home', 'desktop'],
    },
    /* ──────────────────────────── Sales / CS ─────────────────────────── */
    {
        id: 'sales-meeting-prep',
        category: 'sales',
        title: 'Brief me before every meeting',
        subtitle: 'Walk into every call enriched and informed.',
        nodes: [
            { label: 'Calendar', icon: 'calendar', tone: 'source', brandSlug: 'googlecalendar' },
            DUET_NODE,
            { label: 'Brief', icon: 'file-magnifying-glass', tone: 'output' },
        ],
        deliverable: 'automation',
        requiredToolkits: [{ slug: 'googlecalendar', label: 'Google Calendar' }],
        whatYoullGet: [
            'Pre-meeting briefs auto-generated for every external call',
            'Attendee enrichment: role, company, recent signals',
            'Talking points + likely objections, tailored to the deal stage',
            'Brief delivered into this channel before the meeting starts',
        ],
        whatIllAsk: [
            'Which calendar to watch and how far ahead to brief (15min, 1h, day-of)',
            'Which meeting types to skip (internal, recurring, etc.)',
            'How long and how dense the brief should be',
        ],
        seedPrompt: 'Set up automated pre-meeting prep. For each new external meeting on my calendar, enrich the attendees (role, company, recent signals), generate a tight brief with talking points and likely objections tailored to the deal stage, and post it into this channel before the meeting. Start by asking: which calendar to watch, how far ahead (15m / 1h / day-of), which meeting types to skip, and how dense I want the brief.',
        primarySkillId: 'sales-meeting-prep',
        supportingSkillIds: ['go-to-market', 'composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'sales-onboarding-drip',
        category: 'sales',
        title: 'Personalize new-user onboarding emails',
        subtitle: "Drips that actually reflect each user's site & use case.",
        nodes: [
            { label: 'Signup', icon: 'user-circle', tone: 'source' },
            DUET_NODE,
            { label: 'Drip', icon: 'path', tone: 'output', brandSlug: 'gmail' },
        ],
        deliverable: 'automation',
        requiredToolkits: [{ slug: 'gmail', label: 'Gmail' }],
        whatYoullGet: [
            'Per-user onboarding drips personalized from their website + signup',
            'Different sequences for different user archetypes',
            'Sends scheduled across days, not blasted in one shot',
            "A view of who's converting through each step",
        ],
        whatIllAsk: [
            'Where new signups land (auth provider, app DB, sheet)',
            'The 2–3 user archetypes you want to handle differently',
            'The outcome each drip should drive toward (activation, paid, demo)',
        ],
        seedPrompt: 'Build a personalized onboarding email drip. When a new user signs up, scrape their website + any context I have, classify them into one of the archetypes I define, and run a multi-day drip tailored to their use case. Track conversion through each step. Start by asking: where new signups land, the 2–3 archetypes to handle differently, and the outcome each drip should drive toward.',
        primarySkillId: 'outbound-campaign',
        supportingSkillIds: ['firecrawl', 'composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'sales-support-triage',
        category: 'sales',
        title: 'Triage and draft support replies',
        subtitle: 'Tickets routed and drafted before your team opens the inbox.',
        nodes: [
            { label: 'Tickets', icon: 'tray', tone: 'source' },
            DUET_NODE,
            { label: 'Draft', icon: 'note-pencil', tone: 'output' },
        ],
        deliverable: 'automation',
        requiredToolkits: [],
        whatYoullGet: [
            'Auto-triage on every new ticket: priority, topic, owner',
            'Drafted replies based on past resolutions and your docs',
            'Clean handoff into the support tool of your choice',
            'A daily digest of what was routed and what is still open',
        ],
        whatIllAsk: [
            'Which support tool you use (Intercom, Zendesk, HubSpot, email)',
            'Where your help docs / past resolutions live',
            'Routing rules: which topics go to which person',
        ],
        seedPrompt: 'Set up support ticket triage with drafted replies. For each new ticket, classify priority + topic, route to the right owner, and draft a reply grounded in past resolutions and our docs. Send a daily digest of routed vs open. Start by asking: which support tool I use, where help docs / past resolutions live, and the routing rules per topic.',
        primarySkillId: 'support-ticket-triage',
        supportingSkillIds: ['composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'sales-customer-health',
        category: 'sales',
        title: 'Spot churn before the renewal',
        subtitle: 'Catch churn risk before the renewal call.',
        nodes: [
            { label: 'Usage', icon: 'chart-line', tone: 'source', brandSlug: 'posthog' },
            DUET_NODE,
            { label: 'Outreach', icon: 'heart', tone: 'output' },
        ],
        deliverable: 'recurring',
        requiredToolkits: [{ slug: 'posthog', label: 'PostHog' }],
        whatYoullGet: [
            'A health score per customer based on real usage signals',
            'Alerts when an account flips into at-risk territory',
            'Drafted proactive outreach for the at-risk accounts',
            'A weekly health board so the team sees the whole portfolio',
        ],
        whatIllAsk: [
            'Where usage data lives (PostHog, Convex, app DB)',
            'The signals that actually predict churn for your product',
            'Who owns outreach when an account turns red',
        ],
        seedPrompt: 'Build a usage-based customer health monitor. Pull live usage signals, score each account, and alert when one flips at-risk. Draft proactive outreach for at-risk accounts and post a weekly health board. Start by asking: where usage data lives, which signals predict churn for my product, and who owns outreach when an account turns red.',
        primarySkillId: 'scheduled-pipeline',
        supportingSkillIds: ['cross-source-dashboard', 'composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    /* ──────────────────────────── Operations ─────────────────────────── */
    {
        id: 'ops-inbox-flow',
        category: 'operations',
        title: 'Run my inbox end-to-end',
        subtitle: 'Every email handled — none auto-sent without you.',
        nodes: [
            { label: 'Inbox', icon: 'tray', tone: 'source', brandSlug: 'gmail' },
            DUET_NODE,
            { label: 'Approval', icon: 'list-checks', tone: 'output' },
        ],
        deliverable: 'automation',
        requiredToolkits: [{ slug: 'gmail', label: 'Gmail' }],
        whatYoullGet: [
            'Every inbound email triaged into a clear bucket',
            'Drafted replies for the threads that need a response',
            'A single approval queue — approve, edit, or send-as-is',
            'Weekly recap of what was handled and what was left for you',
        ],
        whatIllAsk: [
            'The labels / filters that define the inbox to manage',
            'Tone + signature to use in drafts',
            'Anything you never want me to draft automatically',
        ],
        seedPrompt: 'Build an end-to-end inbox flow: triage every inbound email into a clear bucket, draft replies for the ones that need one, and queue them for my approval — never auto-send. Send me a weekly recap. Start by asking: which labels / filters define the inbox to manage, the tone + signature to use, and any topics I never want auto-drafted.',
        primarySkillId: 'email-triage',
        supportingSkillIds: ['composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'ops-cross-source-dashboard',
        category: 'operations',
        title: 'One dashboard for every metric',
        subtitle: 'Stripe + PostHog + Convex + GSC in one live view.',
        nodes: [
            { label: 'Sources', icon: 'table', tone: 'source', brandSlug: 'stripe' },
            DUET_NODE,
            { label: 'Dashboard', icon: 'chart-line', tone: 'output' },
        ],
        deliverable: 'app',
        requiredToolkits: [
            { slug: 'stripe', label: 'Stripe' },
            { slug: 'posthog', label: 'PostHog' },
        ],
        whatYoullGet: [
            'A live dashboard pulling from Stripe, PostHog, Convex, GSC, and more',
            'Top-line cards plus drill-down charts on the metrics that matter',
            'A shareable URL — bookmark for the team',
            'A cron that keeps each panel fresh in the background',
        ],
        whatIllAsk: [
            'Which sources to connect and any creds you already have',
            'The 3–5 metrics that matter most to you',
            'Default time window (today / 7d / month) and refresh cadence',
        ],
        seedPrompt: 'Build a live cross-source dashboard pulling from Stripe + PostHog + Convex + GSC (and any others I name). Show top-line cards plus drill-downs on the 3–5 metrics that matter, with a shareable URL the team can bookmark. Refresh in the background on a cron. Start by asking: which sources to connect, the 3–5 metrics, and the default window + refresh cadence.',
        primarySkillId: 'cross-source-dashboard',
        supportingSkillIds: ['build-apps', 'composio-credentials', 'cron'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'ops-anomaly-alerts',
        category: 'operations',
        title: 'Catch anomalies in real time',
        subtitle: 'Card-testing, revenue gaps, auth loops — caught early.',
        nodes: [
            { label: 'Signals', icon: 'warning', tone: 'source' },
            DUET_NODE,
            { label: 'Alerts', icon: 'megaphone', tone: 'output' },
        ],
        deliverable: 'automation',
        requiredToolkits: [],
        whatYoullGet: [
            'Continuous anomaly detection across the signals you care about',
            'Smart alerts in this channel (or wherever you want) when something is off',
            'Context attached: what changed, when, and what to check next',
            'A small page listing every alert and its current status',
        ],
        whatIllAsk: [
            'Which signals to watch (Stripe charges, auth errors, revenue, traffic, etc.)',
            'How sensitive the detector should be',
            'Where to send the alerts and who to escalate to',
        ],
        seedPrompt: 'Set up anomaly alerts across the signals I name (Stripe card-testing, revenue gaps, auth loops, traffic, etc.). Detect anomalies continuously, alert in this channel with context (what changed, when, what to check), and keep a small page listing every alert + status. Start by asking: which signals to watch, sensitivity, and where to send alerts + who to escalate to.',
        primarySkillId: 'scheduled-pipeline',
        supportingSkillIds: ['cron', 'composio-credentials', 'webhook-collector'],
        surfaces: ['home', 'desktop'],
    },
    /* ──────────────────────────── Research / Strategy ─────────────────────────── */
    {
        id: 'research-competitor-deep-dive',
        category: 'research',
        title: 'Deep-dive any competitor',
        subtitle: 'Landscape, product, and pricing — fully researched.',
        nodes: [
            { label: 'Targets', icon: 'shopping-bag', tone: 'source' },
            DUET_NODE,
            { label: 'Report', icon: 'file-magnifying-glass', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [],
        whatYoullGet: [
            'A deep-dive per competitor: landscape, product, pricing, GTM',
            'Side-by-side comparison against your own positioning',
            'Cited sources for every claim — no hand-waving',
            'A crisp executive summary at the top',
        ],
        whatIllAsk: [
            'Which competitors to deep-dive on',
            'Aspects to emphasize (product, pricing, GTM, hiring, funding)',
            'Length and format (memo, deck, doc)',
        ],
        seedPrompt: 'Run a competitor deep-dive on the targets I name. Cover landscape, product, pricing, and GTM, with cited sources for every claim and a side-by-side comparison against my own positioning. Open with a crisp exec summary. Start by asking: which competitors, which aspects to emphasize, and the desired length + format.',
        primarySkillId: 'deep-research',
        supportingSkillIds: ['go-to-market', 'firecrawl', 'competitor-watch'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'research-multi-source',
        category: 'research',
        title: 'Research anything, fully cited',
        subtitle: 'Multi-source synthesis with citations on every claim.',
        nodes: [
            { label: 'Sources', icon: 'magnifying-glass', tone: 'source' },
            DUET_NODE,
            { label: 'Report', icon: 'newspaper', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [],
        whatYoullGet: [
            'Multi-source synthesis on any topic, with full citations',
            'Conflicting claims surfaced explicitly, not flattened',
            'Confidence levels on the conclusions',
            'Output as memo, deck, or live doc — your call',
        ],
        whatIllAsk: [
            'The research question and any constraints',
            'Sources to prioritize or avoid',
            'Output format and depth (skim memo vs full report)',
        ],
        seedPrompt: 'Set up Aomni-style multi-source deep research. From a research question, pull from many sources, synthesize with full citations, surface conflicting claims explicitly, and attach confidence levels. Output the report in the format I pick (memo, deck, live doc). Start by asking: the research question + constraints, sources to prioritize or avoid, and the output format + depth.',
        primarySkillId: 'deep-research',
        supportingSkillIds: ['firecrawl'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'research-api-feasibility',
        category: 'research',
        title: 'Scope an API integration',
        subtitle: 'Is this thing buildable? Here is exactly how.',
        nodes: [
            { label: 'API docs', icon: 'plug', tone: 'source' },
            DUET_NODE,
            { label: 'Spec', icon: 'note-pencil', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [],
        whatYoullGet: [
            'A feasibility memo for any candidate API or integration',
            'Concrete request/response examples and auth flow',
            'Risks, rate limits, edge cases, and pricing called out',
            'A first-cut implementation plan with effort estimate',
        ],
        whatIllAsk: [
            'Which API / product to investigate',
            'What you actually want to do with it (the user-facing outcome)',
            'Constraints (latency, scale, must-not-store-data, etc.)',
        ],
        seedPrompt: 'Run an API / integration feasibility exploration. Read the docs of the API I name, produce a memo with concrete request/response examples, auth flow, risks, rate limits, edge cases, pricing, and a first-cut implementation plan with effort estimate. Start by asking: which API, the user-facing outcome I want, and any hard constraints (latency, scale, data residency).',
        primarySkillId: 'deep-research',
        supportingSkillIds: ['firecrawl', 'github'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'research-funnel-analysis',
        category: 'research',
        title: 'Find where users drop off',
        subtitle: 'Across PostHog, Stripe, and your app DB.',
        nodes: [
            { label: 'Analytics', icon: 'chart-line', tone: 'source', brandSlug: 'posthog' },
            DUET_NODE,
            { label: 'Insights', icon: 'funnel', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [{ slug: 'posthog', label: 'PostHog' }],
        whatYoullGet: [
            'Funnel analysis across PostHog + Stripe + app DB in one place',
            'Cohort retention curves with the segments you actually care about',
            'Diagnoses on where users drop off and why',
            'Concrete experiment ideas to fix each drop-off',
        ],
        whatIllAsk: [
            'Which sources to pull from and any auth you have',
            'The funnel stages that map to your business',
            'Which segments matter (plan, persona, channel)',
        ],
        seedPrompt: 'Run a retention + funnel analysis across PostHog + Stripe + app DB. Build the funnel stages I describe, generate cohort retention curves for the segments I care about, diagnose where users drop off, and propose concrete experiments to fix each drop-off. Start by asking: which sources to pull from, the funnel stages, and which segments matter.',
        primarySkillId: 'cross-source-dashboard',
        supportingSkillIds: ['scheduled-pipeline', 'composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    /* ──────────────────────────── Internal tools / Custom apps ─────────────────────────── */
    {
        id: 'apps-typed-spreadsheet',
        category: 'internal-tools',
        title: 'Build a custom spreadsheet app',
        subtitle: 'Airtable-style — but yours, and shaped to your data.',
        nodes: [
            { label: 'Schema', icon: 'table', tone: 'source' },
            DUET_NODE,
            { label: 'App', icon: 'browser', tone: 'output' },
        ],
        deliverable: 'app',
        requiredToolkits: [],
        whatYoullGet: [
            'Multi-tab typed spreadsheet app — text, number, date, select, links',
            'Full CRUD with optimistic updates and undo',
            'Filters, sorts, and saved views per tab',
            'Shareable URL with read/write permissions',
        ],
        whatIllAsk: [
            'The tabs you need and the columns per tab',
            'Who should be able to edit vs view',
            'Any starter data to import',
        ],
        seedPrompt: 'Build a typed spreadsheet app, Airtable-style. Multi-tab, with the columns I describe (text / number / date / select / links), full CRUD with optimistic updates + undo, per-tab filters/sorts/saved views, and a shareable URL with read/write permissions. Start by asking: the tabs + columns I need, who can edit vs view, and any starter data to import.',
        primarySkillId: 'internal-tracker-app',
        supportingSkillIds: ['build-apps'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'apps-custom-crm',
        category: 'internal-tools',
        title: 'Custom CRM / pipeline tracker',
        subtitle: 'CLI-style under the hood, polished UI on top.',
        nodes: [
            { label: 'Stages', icon: 'path', tone: 'source' },
            DUET_NODE,
            { label: 'CRM app', icon: 'address-book', tone: 'output' },
        ],
        deliverable: 'app',
        requiredToolkits: [],
        whatYoullGet: [
            'Stages you define, with drag-to-move between columns',
            'Per-record fields tailored to your pipeline',
            'Activity log + notes per record',
            'Import from CSV / sheet to seed it instantly',
        ],
        whatIllAsk: [
            'Stages and the fields each record should carry',
            'Where existing pipeline data lives (sheet, CSV, paste)',
            'Who needs access',
        ],
        seedPrompt: 'Build a custom CRM / pipeline tracker. Stages I define with drag-to-move, per-record fields tailored to my pipeline, activity log + notes per record, and CSV / sheet import to seed it. Start by asking: the stages + fields, where existing data lives, and who needs access.',
        primarySkillId: 'internal-tracker-app',
        supportingSkillIds: ['crm', 'build-apps'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'apps-internal-dashboards',
        category: 'internal-tools',
        title: 'Build a live team dashboard',
        subtitle: 'Internal views shared safely via URL — role-gated.',
        cardIcon: 'chart-line',
        nodes: [
            { label: 'Data', icon: 'table', tone: 'source' },
            DUET_NODE,
            { label: 'Dashboard', icon: 'chart-line', tone: 'output' },
        ],
        deliverable: 'app',
        requiredToolkits: [],
        whatYoullGet: [
            'Internal dashboards shared via permission-gated URLs',
            'Per-role visibility (admin sees all, ops sees ops, etc.)',
            'Live data — refreshed in the background',
            'Audit log of who viewed what and when',
        ],
        whatIllAsk: [
            'Which data sources and which views matter',
            'The roles you need and what each should see',
            'Refresh cadence per panel',
        ],
        seedPrompt: 'Build internal dashboards behind permission-gated URLs. Per-role visibility (admin / ops / etc.), live data refreshed in the background, and an audit log of who viewed what. Start by asking: which data sources + views, the roles + what each should see, and the refresh cadence per panel.',
        primarySkillId: 'cross-source-dashboard',
        supportingSkillIds: ['build-apps', 'composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'apps-brand-portal',
        category: 'internal-tools',
        title: 'Brand asset portal + knowledge base',
        subtitle: 'One link your team can always find the right asset in.',
        nodes: [
            { label: 'Files', icon: 'files', tone: 'source' },
            DUET_NODE,
            { label: 'Portal', icon: 'browser', tone: 'output' },
        ],
        deliverable: 'app',
        requiredToolkits: [],
        whatYoullGet: [
            'A searchable portal of brand assets and knowledge base entries',
            'Tagged + categorized so the right thing is one search away',
            'Permissioned download links',
            'A simple admin to add / retire entries over time',
        ],
        whatIllAsk: [
            'What lives in the portal (logos, decks, docs, tone guides, etc.)',
            'Tag taxonomy and any existing folder structure',
            'Who can read and who can admin',
        ],
        seedPrompt: 'Build a brand asset portal + knowledge base. Searchable, tagged + categorized, with permissioned download links and a simple admin to add / retire entries. Start by asking: what lives in the portal (logos, decks, docs, tone guides), the tag taxonomy / existing structure, and who can read vs admin.',
        primarySkillId: 'build-apps',
        supportingSkillIds: ['branded-asset-generator', 'file-conversion', 'pdf'],
        surfaces: ['home', 'desktop'],
    },
    /* ──────────────────────────── Personal assistant ─────────────────────────── */
    {
        id: 'personal-calendar',
        category: 'personal',
        title: 'Calendar management + meeting prep',
        subtitle: 'Calendar tetris — without you playing it.',
        nodes: [
            { label: 'Calendar', icon: 'calendar', tone: 'source', brandSlug: 'googlecalendar' },
            DUET_NODE,
            { label: 'Plan', icon: 'list-checks', tone: 'output' },
        ],
        deliverable: 'automation',
        requiredToolkits: [{ slug: 'googlecalendar', label: 'Google Calendar' }],
        whatYoullGet: [
            'Daily plan with prep notes per meeting',
            'Smart rescheduling proposals when conflicts appear',
            'Buffer time and focus blocks protected automatically',
            'A morning brief in this channel before the day starts',
        ],
        whatIllAsk: [
            'Working hours and the focus blocks you want protected',
            'How long each prep note should be',
            'Whether reschedules should be auto-proposed or auto-applied',
        ],
        seedPrompt: 'Run my calendar. Each morning post a daily plan with prep notes per meeting, propose reschedules when conflicts appear, and protect buffer + focus blocks automatically. Start by asking: my working hours, focus blocks to protect, prep note length, and whether reschedules should auto-apply or only propose.',
        primarySkillId: 'composio-credentials',
        supportingSkillIds: ['cron', 'sales-meeting-prep'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'personal-travel',
        category: 'personal',
        title: 'Plan a trip end-to-end',
        subtitle: 'Researched flights, hotels, and a full itinerary — ready for you to book.',
        nodes: [
            { label: 'Trip', icon: 'airplane-tilt', tone: 'source' },
            DUET_NODE,
            { label: 'Itinerary', icon: 'list-checks', tone: 'output' },
        ],
        deliverable: 'workflow',
        requiredToolkits: [],
        whatYoullGet: [
            'Researched flight + hotel options ranked by your preferences',
            'A full draft itinerary: ground transit, dining, contingencies',
            'Calendar holds dropped onto your day (when Google Calendar is connected)',
            'A shareable summary you can hand to anyone (or yourself) to book',
        ],
        whatIllAsk: [
            'Travel preferences (airlines, hotels, seat class, budget)',
            'Loyalty programs to use',
            'Default rules (e.g. always direct flights, always lounge access)',
        ],
        seedPrompt: "Plan my travel end-to-end. From a destination + dates, research flights + hotels ranked by my preferences, draft a full itinerary (ground transit, dining, contingencies), and produce a shareable summary I can use to book. If Google Calendar is connected, also drop holds onto my day. I'll do the actual booking myself unless I tell you otherwise. Start by asking: my travel preferences, loyalty programs, and default rules.",
        primarySkillId: 'deep-research',
        supportingSkillIds: ['firecrawl', 'composio-credentials'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'personal-second-brain',
        category: 'personal',
        title: 'Build a personal knowledge base',
        subtitle: 'A searchable home for notes, people, and decisions you tell me about.',
        nodes: [
            { label: 'Notes', icon: 'brain', tone: 'source' },
            DUET_NODE,
            { label: 'Knowledge base', icon: 'magnifying-glass', tone: 'output' },
        ],
        deliverable: 'app',
        requiredToolkits: [],
        whatYoullGet: [
            'A hosted personal knowledge base at a shareable URL',
            'Tabs for the things you want to track (people, projects, decisions)',
            'Full-text search across everything you save',
            'A clear way to add new entries from chat',
        ],
        whatIllAsk: [
            'What you want to keep — people, projects, decisions, preferences, all of it',
            'How you take notes today and what should carry over',
            'Anything I should never save',
        ],
        seedPrompt: 'Build me a personal knowledge base as a hosted app. Tabs for the categories I name (people, projects, decisions, preferences, etc.), full-text search, and a simple way to add entries from this chat. Start by asking: what I want to track, how I take notes today, and anything I should never save. Then build it, deploy it, and share the URL.',
        primarySkillId: 'internal-tracker-app',
        supportingSkillIds: ['build-apps'],
        surfaces: ['home', 'desktop'],
    },
    {
        id: 'personal-reminders',
        category: 'personal',
        title: 'Reminders + scheduled check-ins',
        subtitle: 'Nudges at the right time — not a vibrating list of dread.',
        nodes: [
            { label: 'Schedule', icon: 'bell', tone: 'source' },
            DUET_NODE,
            { label: 'Check-in', icon: 'trend-up', tone: 'output' },
        ],
        deliverable: 'recurring',
        requiredToolkits: [],
        whatYoullGet: [
            'Reminders timed to context, not just clock time',
            'Recurring check-ins on goals, habits, projects you care about',
            'A way to snooze / change cadence on the fly',
            'A weekly review of what you tracked',
        ],
        whatIllAsk: [
            'What you want reminded about (one-offs, habits, project nudges)',
            'When you actually want to be interrupted vs deferred',
            'Whether check-ins should be light or push you a bit',
        ],
        seedPrompt: 'Set up reminders + scheduled check-ins. Send context-aware reminders (not just clock-time), run recurring check-ins on goals / habits / projects, allow easy snooze + cadence change, and post a weekly review. Start by asking: what to remind me about, when I want to be interrupted vs deferred, and whether check-ins should be light or push me.',
        primarySkillId: 'cron',
        supportingSkillIds: ['duet'],
        surfaces: ['home', 'desktop'],
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
/** Look up a use case by id. */
export function getUseCaseById(id) {
    if (!id)
        return undefined;
    return USE_CASES.find((u) => u.id === id);
}
/**
 * Look up the local skill metadata referenced as `primarySkillId` for a use case.
 * Returns `undefined` if the primary id references a chat-app default skill —
 * the caller should resolve those against chat-app's own metadata.
 */
export function getSkillForUseCase(useCase) {
    return SKILL_METADATA.find((s) => s.id === useCase.primarySkillId);
}
/** All `primarySkillId` + `supportingSkillIds` for a use case as a flat array. */
export function getAllSkillIdsForUseCase(useCase) {
    return [useCase.primarySkillId, ...(useCase.supportingSkillIds ?? [])];
}
/**
 * Returns the full catalog ordered with the user's category first, then the
 * remaining use cases grouped by their categories in a sensible order.
 */
export function getOrderedUseCases(preferredCategory) {
    const order = [
        preferredCategory,
        ...Object.keys(CATEGORY_LABELS).filter((c) => c !== preferredCategory),
    ];
    return order.flatMap((cat) => USE_CASES.filter((u) => u.category === cat));
}
//# sourceMappingURL=use-cases.js.map