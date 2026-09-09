/**
 * Reduced motion, simulated on a subtree.
 *
 * The package collapses motion in exactly one place: a
 * `prefers-reduced-motion: reduce` block in `theme.css` that reassigns the
 * motion custom properties. Custom properties inherit, so reassigning the same
 * properties on a wrapper element reproduces that collapse for everything
 * inside it, using the same mechanism rather than an approximation.
 *
 * This matters for the workbench because `prefers-reduced-motion` is an
 * operating-system setting. Without this, a reduced-motion story could only be
 * reviewed by changing a system preference and reloading, which is exactly the
 * kind of check that stops happening.
 *
 * It is a simulation, and the limits are real: it proves that a component
 * consuming the motion tokens collapses correctly, and it proves nothing about
 * a component that reached past a token for a raw value. That second case is
 * still caught, just visibly — such a component keeps moving in the story.
 *
 * `reduced-motion.test.ts` asserts that the properties written here are exactly
 * the properties the stylesheet's real rule writes, so the two cannot drift.
 */

import { cssVar, rolesIn, roleValue } from "./tokens.js";

/** Role that holds the collapsed value, in each category that collapses. */
const REDUCED_ROLE = "reduced";

/**
 * The custom-property overrides that reproduce the package's reduced-motion
 * collapse: durations to the reduced duration, scales to the reduced scale,
 * distances to zero.
 *
 * Derived from the shipped token JSON rather than listed by hand. A new
 * duration role is covered the moment it exists, and no value is restated in a
 * second place where it could go stale.
 */
export function reducedMotionOverrides(): Record<string, string> {
  const overrides: Record<string, string> = {};

  for (const [role] of rolesIn("duration")) {
    if (role === REDUCED_ROLE) continue;
    overrides[cssVar(`duration.${role}`)] = roleValue(`duration.${REDUCED_ROLE}`);
  }

  for (const [role] of rolesIn("scale")) {
    if (role === REDUCED_ROLE) continue;
    overrides[cssVar(`scale.${role}`)] = roleValue(`scale.${REDUCED_ROLE}`);
  }

  // Distance has no reduced role: zero is the collapsed value, and a
  // `distance.reduced` token would only ever hold `0px`.
  for (const [role] of rolesIn("distance")) {
    overrides[cssVar(`distance.${role}`)] = "0px";
  }

  return overrides;
}
