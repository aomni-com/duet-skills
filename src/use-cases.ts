import type { UseCase } from "./types.js";

/**
 * Canonical list of Duet use cases.
 *
 * Source of truth for the home tab, desktop compose overlay, marketing site,
 * onboarding flows, and docs. Anything that displays "what can Duet do"
 * should consume this list rather than hard-coding a subset.
 *
 * Editing rules (from MEMORY.md, Walter, 2026-04-23):
 *  - Do NOT silently add entries. Propose new use cases to a human first.
 *  - When in doubt, prefer fewer, sharper use cases over a long tail.
 *  - Stable `id` values are a contract — never rename, only deprecate.
 */
export const USE_CASES: readonly UseCase[] = [
  // -------------------------------------------------------------------------
  // Featured (home + desktop)
  // -------------------------------------------------------------------------
  {
    id: "generate-image",
    title: "Generate an image",
    shortLabel: "Image",
    description:
      "Create an image from a text prompt. Uses Nano Banana 2 by default with fallbacks for video and editing.",
    icon: "Image",
    promptTemplate: "Generate an image of: {input}",
    examplePrompts: [
      "Generate an image of a Wes Anderson-style office at golden hour",
      "Generate an image of a 3D isometric icon for a CRM app",
      "Generate an image of our logo on a billboard in Times Square",
    ],
    category: "content",
    tags: ["image", "media", "design", "nano-banana", "creative"],
    surfaces: ["home", "desktop", "marketing"],
    order: 10,
  },
  {
    id: "deep-research",
    title: "Deep research",
    shortLabel: "Research",
    description:
      "Multi-source web research with citations. Pulls from search, scraping, and structured data sources.",
    icon: "MagnifyingGlass",
    promptTemplate: "Do deep research on: {input}",
    examplePrompts: [
      "Do deep research on the AI agent harness landscape in 2026",
      "Do deep research on enterprise sales motions for vertical SaaS",
      "Do deep research on Series A fundraising trends in dev tools",
    ],
    category: "research",
    tags: ["research", "web-search", "reports", "analysis"],
    surfaces: ["home", "desktop", "marketing"],
    order: 20,
  },
  {
    id: "get-news",
    title: "Get the latest news",
    shortLabel: "News",
    description:
      "Fresh news on a topic, company, or person, summarized with sources.",
    icon: "Globe",
    promptTemplate: "Get me the latest news about: {input}",
    examplePrompts: [
      "Get me the latest news about Anthropic",
      "Get me the latest news about the AI agent space",
      "Get me the latest news about our top three competitors",
    ],
    category: "research",
    tags: ["news", "web-search", "monitoring"],
    surfaces: ["home", "desktop"],
    order: 30,
  },
  {
    id: "brainstorm",
    title: "Brainstorm a topic",
    shortLabel: "Brainstorm",
    description:
      "Open-ended ideation. Great for naming, positioning, content angles, and product concepts.",
    icon: "Lightbulb",
    promptTemplate: "Help me brainstorm ideas for: {input}",
    examplePrompts: [
      "Help me brainstorm ideas for a launch tagline",
      "Help me brainstorm ideas for a hackathon project",
      "Help me brainstorm ideas for a follow-up email after a conference",
    ],
    category: "content",
    tags: ["ideation", "creative", "naming", "strategy"],
    surfaces: ["home", "desktop"],
    order: 40,
  },
  {
    id: "competitor-research",
    title: "Competitor research",
    shortLabel: "Competitors",
    description:
      "Side-by-side competitor breakdowns: product, pricing, positioning, and recent moves.",
    icon: "Buildings",
    promptTemplate: "Research competitors for: {input}",
    examplePrompts: [
      "Research competitors for a Slack-replacement chat app for AI teams",
      "Research competitors for a pay-per-lead vet outbound service",
      "Research competitors for our company",
    ],
    category: "research",
    tags: ["competitor", "gtm", "positioning", "analysis"],
    surfaces: ["home", "desktop", "marketing"],
    order: 50,
  },
  {
    id: "create-app",
    title: "Build an app",
    shortLabel: "App",
    description:
      "Scaffold and host a custom internal tool, dashboard, or mini-app on your private Duet server.",
    icon: "AppWindow",
    promptTemplate: "Create an app that {input}",
    examplePrompts: [
      "Create an app that tracks my Stripe + PostHog metrics on one page",
      "Create an app that lets my team submit and vote on ideas",
      "Create an app that visualises our pipeline from Attio",
    ],
    category: "internal-tools",
    tags: ["app", "build", "hosting", "dashboard", "internal-tools"],
    surfaces: ["desktop", "marketing"],
    order: 60,
  },

  // -------------------------------------------------------------------------
  // Marketing / onboarding only — not on the home chip rail today
  // Sourced from memory/use-cases.md (canonical, approved). Add new entries
  // only after explicit human approval.
  // -------------------------------------------------------------------------
  {
    id: "triage-inbox",
    title: "Triage your inbox",
    shortLabel: "Inbox",
    description:
      "Read, classify, and draft personalized replies for incoming email. Approve before sending.",
    icon: "Envelope",
    promptTemplate: "Triage my inbox and draft replies for: {input}",
    examplePrompts: [
      "Triage my inbox and draft replies for anything that looks like a sales lead",
      "Triage my inbox and draft replies for support tickets from paying customers",
      "Triage my inbox and summarize anything I need to act on today",
    ],
    category: "operations",
    tags: ["email", "triage", "inbox", "automation", "support"],
    surfaces: ["marketing", "onboarding"],
    order: 110,
  },
  {
    id: "lead-enrichment-outbound",
    title: "Enrich leads and run outbound",
    shortLabel: "Outbound",
    description:
      "Enrich prospects with firmographics + persona signals, then sequence personalized outbound via Instantly or HeyReach.",
    icon: "PaperPlaneTilt",
    promptTemplate: "Enrich and run outbound to: {input}",
    examplePrompts: [
      "Enrich and run outbound to independent veterinary clinics in Texas",
      "Enrich and run outbound to all leads who attended our HumanX booth",
      "Enrich and run outbound to YC W26 batch founders",
    ],
    category: "growth",
    tags: ["outbound", "sales", "enrichment", "gtm", "crm"],
    surfaces: ["marketing"],
    order: 120,
  },
  {
    id: "weekly-report",
    title: "Generate a weekly report",
    shortLabel: "Report",
    description:
      "Synthesize cross-source data (Stripe, PostHog, Convex, GSC, Sentry) into a weekly readout.",
    icon: "ChartLineUp",
    promptTemplate: "Generate a weekly {input} report",
    examplePrompts: [
      "Generate a weekly growth report covering signups, activation, and revenue",
      "Generate a weekly engineering report covering PRs, incidents, and uptime",
      "Generate a weekly SEO report covering rankings, clicks, and AI citations",
    ],
    category: "operations",
    tags: ["report", "analytics", "dashboard", "weekly", "kpi"],
    surfaces: ["marketing"],
    order: 130,
  },
  {
    id: "long-form-content",
    title: "Write a long-form blog post",
    shortLabel: "Blog",
    description:
      "Draft an SEO + AI-citable long-form article aligned with your brand voice and content strategy.",
    icon: "Article",
    promptTemplate: "Write a long-form blog post about: {input}",
    examplePrompts: [
      "Write a long-form blog post about how to hire your first AI employee",
      "Write a long-form blog post about Duet vs OpenAI Workspace Agents",
      "Write a long-form blog post about running a lean GTM team with AI",
    ],
    category: "content",
    tags: ["blog", "seo", "content", "long-form", "writing"],
    surfaces: ["marketing"],
    order: 140,
  },
  {
    id: "meeting-prep",
    title: "Prepare for a meeting",
    shortLabel: "Meeting",
    description:
      "Pull attendee backgrounds, prior context, and a tailored briefing pack ahead of any call.",
    icon: "CalendarCheck",
    promptTemplate: "Prepare a brief for my meeting with: {input}",
    examplePrompts: [
      "Prepare a brief for my meeting with the founders of Acme Corp",
      "Prepare a brief for my 1:1 with our top customer this week",
      "Prepare a brief for my investor update tomorrow",
    ],
    category: "sales",
    tags: ["meeting", "briefing", "sales", "enrichment", "prep"],
    surfaces: ["marketing"],
    order: 150,
  },
  {
    id: "scheduled-monitoring",
    title: "Set up scheduled monitoring",
    shortLabel: "Monitor",
    description:
      "Cron-driven checks that page you when something breaks — uptime, gateway spend, staging health, anomaly alerts.",
    icon: "AlarmClock",
    promptTemplate: "Set up scheduled monitoring for: {input}",
    examplePrompts: [
      "Set up scheduled monitoring for my homepage uptime every 5 minutes",
      "Set up scheduled monitoring for unusual Stripe activity",
      "Set up scheduled monitoring for new Sentry crash spikes",
    ],
    category: "engineering",
    tags: ["cron", "monitoring", "alerts", "reliability", "automation"],
    surfaces: ["marketing"],
    order: 160,
  },
  {
    id: "support-triage",
    title: "Triage support tickets",
    shortLabel: "Support",
    description:
      "Classify, route, and draft replies for incoming support requests. Logs to your ticket system.",
    icon: "LifeRing",
    promptTemplate: "Triage support tickets and {input}",
    examplePrompts: [
      "Triage support tickets and draft replies for billing questions",
      "Triage support tickets and escalate anything mentioning login issues",
      "Triage support tickets and produce a weekly themes report",
    ],
    category: "sales",
    tags: ["support", "triage", "tickets", "cs", "automation"],
    surfaces: ["marketing"],
    order: 170,
  },
  {
    id: "second-brain",
    title: "Second-brain memory",
    shortLabel: "Memory",
    description:
      "Persistent personal memory — facts, decisions, people, preferences — recalled across every future session.",
    icon: "Brain",
    promptTemplate: "Remember this for me: {input}",
    examplePrompts: [
      "Remember this for me: my co-founder's birthday is March 14",
      "Remember this for me: we decided to use Postgres over MongoDB because of relational requirements",
      "Remember this for me: the CFO prefers concise weekly updates over real-time pings",
    ],
    category: "personal",
    tags: ["memory", "personal", "recall", "persistence"],
    surfaces: ["marketing", "onboarding"],
    order: 180,
  },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

import type { UseCaseCategory, UseCaseSurface } from "./types.js";

/** Returns use cases that should render on the given surface, sorted by `order`. */
export function getUseCasesForSurface(surface: UseCaseSurface): UseCase[] {
  return USE_CASES.filter((uc) => uc.surfaces.includes(surface)).sort(
    (a, b) => a.order - b.order,
  );
}

/** Returns use cases in a given category, sorted by `order`. */
export function getUseCasesByCategory(category: UseCaseCategory): UseCase[] {
  return USE_CASES.filter((uc) => uc.category === category).sort(
    (a, b) => a.order - b.order,
  );
}

/** Look up a single use case by id. Returns `undefined` if not found. */
export function getUseCaseById(id: string): UseCase | undefined {
  return USE_CASES.find((uc) => uc.id === id);
}
