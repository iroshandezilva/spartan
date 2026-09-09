/**
 * A soft tint is visibly a shape, not just coloured text.
 *
 * The colour ramps share one lightness ladder: `neutral.100`, `primary.100` and
 * `danger.100` all sit at L 95%. The surface roles occupy rungs of that ladder,
 * so a tint aliased to the same rung as the surface it sits on has a contrast
 * ratio of exactly 1.00 against it. The colours differ, the luminance does not,
 * and the chip disappears for anyone who is not resolving hue.
 *
 * That is not hypothetical. Every one of the six tints shipped at 1.00 against
 * `background.default` in light and 1.00 to 1.03 against `surface.default` in
 * dark, and passed the contrast gate the whole time, because `check:colors`
 * measures the text on the tint and never the tint against what is behind it.
 * It was found by measuring while building the first component to use them.
 *
 * The floor here is deliberately not 3:1. WCAG 1.4.11 asks for 3:1 from a
 * graphical object required to understand the content, and a Spartant badge is
 * built so its label carries the meaning on its own: the tint reinforces, it
 * never encodes. A light tint on a light page cannot reach 3:1 and stay a soft
 * tint, so demanding it would only produce a filled chip. What the design does
 * owe is a perceptible edge, and 1.05 is the line between "faint" and "not
 * there at all".
 */

import { describe, expect, it } from "vitest";
import { contrastRatio } from "../color/oklch.js";
import { resolveTheme, type ThemeName } from "./themes.js";

/** Families with a `surface` tint. `secondary` has none: it is a filled role. */
const TINT_FAMILIES = ["primary", "accent", "success", "warning", "danger", "information"] as const;

/**
 * The grounds a badge or callout actually sits on.
 *
 * `surface.muted` is deliberately absent, and that absence is the known
 * limitation rather than an oversight: it is itself a rung of the same ladder,
 * so a tint clears it only by colliding with something else. Documented in
 * `src/components/badge/README.md`.
 */
const GROUNDS = ["color.background.default", "color.surface.default"] as const;

/** Below this a fill reads as absent rather than quiet. */
const MINIMUM = 1.05;

const THEMES: readonly ThemeName[] = ["light", "dark"];

describe("soft tints are separable from the grounds they sit on", () => {
  const cases = THEMES.flatMap((theme) =>
    TINT_FAMILIES.flatMap((family) =>
      GROUNDS.map((ground) => ({ theme, family, ground }) as const),
    ),
  );

  it("covers every tint on every ground in both themes", () => {
    expect(cases).toHaveLength(THEMES.length * TINT_FAMILIES.length * GROUNDS.length);
  });

  it.each(cases)("$theme: $family tint against $ground", ({ theme, family, ground }) => {
    const roles = resolveTheme(theme);
    const tint = roles.get(`color.${family}.surface`);
    const behind = roles.get(ground);

    // A missing role would otherwise make the ratio meaningless rather than
    // failing, which is how a renamed token turns a gate into a no-op.
    expect(tint, `color.${family}.surface is missing in ${theme}`).toBeDefined();
    expect(behind, `${ground} is missing in ${theme}`).toBeDefined();
    if (!tint || !behind) return;

    const ratio = Number(contrastRatio(tint, behind).toFixed(2));
    expect(ratio, `color.${family}.surface on ${ground} in ${theme}`).toBeGreaterThanOrEqual(
      MINIMUM,
    );
  });
});
