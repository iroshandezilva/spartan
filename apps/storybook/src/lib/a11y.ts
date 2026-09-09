/**
 * One accessibility configuration, used by both the workbench panel and the
 * test suite.
 *
 * Two configurations would eventually disagree, and the disagreement would be
 * silent in the worst direction: a rule switched off in the panel while a
 * reviewer reads a clean panel and concludes the component is fine. The addon
 * reads this through `.storybook/preview.ts` and `story-a11y.test.tsx` reads
 * the same object.
 */

import type { RunOptions, Spec } from "axe-core";

/**
 * Rules that only make sense for a whole document.
 *
 * A story renders a component into a bare canvas, not a page. These rules would
 * fire on every story forever, and a check that always fails teaches people to
 * ignore the output, which costs more than the rules are worth here. The page
 * itself is Fumadocs' problem, and HAUX-54 owns it.
 */
export const PAGE_LEVEL_RULES = [
  "region",
  "page-has-heading-one",
  "landmark-one-main",
  "bypass",
  "html-has-lang",
  "document-title",
] as const;

/**
 * The rule set every story is held to: WCAG 2.0 through 2.2 at A and AA, plus
 * axe's best practices, minus the page-level rules above.
 *
 * AA rather than AAA deliberately. AAA includes a 7:1 contrast requirement the
 * colour specification does not target, so enabling it would fail the system's
 * own approved palette.
 */
export const AXE_CONFIG: RunOptions = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"],
  },
  rules: Object.fromEntries(PAGE_LEVEL_RULES.map((id) => [id, { enabled: false }])),
};

/**
 * Passed to `axe.configure` before a run.
 *
 * Empty today. It exists because the alternative, when the first rule needs
 * tuning, is a second configuration site that the panel does not read.
 */
export const AXE_SPEC: Spec = {};

/** Per-story accessibility settings, matching the addon's parameter shape. */
export interface A11yParameters {
  /** Skip this story. Requires a reason, so a skip is reviewable. */
  disable?: boolean;
  /** Why it is skipped. Read by the test, which fails a bare `disable`. */
  reason?: string;
  /** Extra axe options merged over {@link AXE_CONFIG} for this story. */
  options?: RunOptions;
}
