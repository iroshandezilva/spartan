/**
 * Slow motion, for reviewing an easing curve.
 *
 * The motion standard asks for review at normal speed and at slowed playback,
 * because 120ms is too short to see whether a curve is right. This multiplies
 * every duration role on a subtree, using the same token-override mechanism the
 * reduced-motion simulation uses: a component that ignores it has reached past a
 * token for a raw value, which is itself worth catching.
 *
 * Durations only. Slowing an easing curve is meaningless, and slowing a distance
 * or scale would change the design rather than the playback.
 */

import { cssVar, rolesIn, roleValue } from "./tokens.js";

/** Slow enough to watch a 120ms curve without the page feeling broken. */
export const SLOW_FACTOR = 8;

/** Duration roles multiplied by `factor`, as custom-property overrides. */
export function slowMotionOverrides(factor: number = SLOW_FACTOR): Record<string, string> {
  const overrides: Record<string, string> = {};

  for (const [role] of rolesIn("duration")) {
    // The collapsed value stays collapsed: multiplying zero is still zero, and
    // writing it out would imply reduced motion has a speed.
    if (role === "reduced") continue;
    const milliseconds = Number.parseFloat(roleValue(`duration.${role}`));
    overrides[cssVar(`duration.${role}`)] = `${milliseconds * factor}ms`;
  }

  return overrides;
}
