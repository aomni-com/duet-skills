/**
 * Departments / functional areas a use case primarily serves.
 * Mirrors the canonical org grouping used in marketing + onboarding.
 */
export type UseCaseCategory =
  | "research"
  | "content"
  | "engineering"
  | "growth"
  | "sales"
  | "operations"
  | "internal-tools"
  | "personal";

/**
 * Surfaces where a use case may be displayed. Consumers filter by surface
 * rather than maintaining their own subset lists.
 *
 * - `home`        — the main web home tab starter card (5 chips)
 * - `desktop`     — the desktop / v2 compose overlay (6 chips, terser labels)
 * - `marketing`   — landing page / docs / SEO surfaces
 * - `onboarding`  — new-user activation flows
 */
export type UseCaseSurface = "home" | "desktop" | "marketing" | "onboarding";

export type UseCase = {
  /** Stable kebab-case identifier. Never change once shipped. */
  id: string;

  /** Full title used in marketing + onboarding contexts. */
  title: string;

  /** Compact label for the desktop chip variant (1 word when possible). */
  shortLabel: string;

  /** One-sentence pitch. Plain text. Used for tooltips, meta descriptions. */
  description: string;

  /**
   * Phosphor icon name (no `Icon` suffix) — e.g. `Image`, `MagnifyingGlass`.
   * Consumers map this to their icon library at render time.
   */
  icon: string;

  /**
   * Prompt the chip prefills into the compose input. `{input}` is the
   * placeholder for the user's continuation. If the user submits without
   * filling `{input}`, treat the literal prefix as the prompt.
   */
  promptTemplate: string;

  /** Concrete fully-formed example prompts for docs, demos, and SEO copy. */
  examplePrompts: string[];

  /** Primary functional area. */
  category: UseCaseCategory;

  /** Freeform keywords for search and SEO. */
  tags: string[];

  /** Surfaces this use case should render on. */
  surfaces: UseCaseSurface[];

  /**
   * Sort order on a given surface. Lower numbers render first.
   * Order is shared across surfaces; surface-specific ordering is rare
   * enough that we keep this simple.
   */
  order: number;
};
