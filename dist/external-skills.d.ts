/**
 * External skill registry — ids of skills authored in OTHER repos but
 * loadable in the same Duet sandbox.
 *
 * The current external set is chat-app's "default skills" — primitives the
 * sandbox boots with regardless of whether the duet-skills package is
 * installed. They live at:
 *
 *   chat-app/packages/backend/registry/sandbox/default-skills/<id>/SKILL.md
 *
 * This list is the canonical record of which external ids are valid targets
 * for `UseCase.skillId`. The build script validates that every use case
 * either references a local skill (authored in this repo) OR an id in this
 * allowlist. Anything else is a typo.
 *
 * SYNC RULE — when a default skill is added/removed/renamed in chat-app,
 * update this list in the same PR. There is intentionally no auto-sync; the
 * lists move slowly enough that a 30-second manual edit is the right tool.
 *
 * Last synced against chat-app/packages/backend/registry/sandbox/default-skills
 * after PR #1219 (impeccable installed as default skill, opened 2026-05-05).
 */
export declare const KNOWN_DEFAULT_SKILL_IDS: readonly ["add-skill", "ai-gateway", "branded-content", "build-apps", "composio-credentials", "create-skill", "crm", "cron", "duet", "env-vars", "file-conversion", "find-skills", "firecrawl", "github", "go-to-market", "impeccable", "media-creation", "pdf", "webhook-collector"];
export type KnownDefaultSkillId = (typeof KNOWN_DEFAULT_SKILL_IDS)[number];
/** True if the id is a recognized chat-app default skill. */
export declare function isKnownDefaultSkillId(id: string): id is KnownDefaultSkillId;
//# sourceMappingURL=external-skills.d.ts.map