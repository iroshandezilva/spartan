import type { Decorator } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { reducedMotionOverrides } from "./reduced-motion.js";
import { SLOW_FACTOR, slowMotionOverrides } from "./slow-motion.js";

/**
 * Renders the story with the package's reduced-motion collapse applied.
 *
 * `prefers-reduced-motion` is an operating-system setting, so without this the
 * only way to review reduced motion is to change a system preference and
 * reload. That is the kind of check that stops happening after the second time.
 *
 * The overrides are the same custom properties the stylesheet's real rule
 * writes, asserted by `reduced-motion.test.ts`. Custom properties inherit, so
 * putting them on a wrapper reproduces the collapse for everything inside.
 *
 * The label is part of the decorator rather than the story, so a reduced-motion
 * story cannot be mistaken for a duplicate of the normal one in a screenshot.
 */
export const withReducedMotion: Decorator = (Story) => (
  <div
    // React writes custom properties through `style`, but `CSSProperties` only
    // describes known properties, so the map has to be asserted into it.
    style={reducedMotionOverrides() as CSSProperties}
    className="grid gap-3"
  >
    <p className="text-caption text-foreground-muted">
      Reduced motion simulated by collapsing the motion tokens on this subtree, which is what{" "}
      <code className="font-mono">prefers-reduced-motion: reduce</code> does in the stylesheet. A
      component that still moves here reached past a token for a raw value.
    </p>
    <Story />
  </div>
);

/**
 * Renders the story with every duration multiplied, so a curve can be watched.
 *
 * The motion standard asks for review at slowed playback as well as normal
 * speed, and 120ms is simply too short to judge. Durations only: slowing an
 * easing curve means nothing, and slowing a distance would change the design
 * rather than the playback.
 */
export const withSlowMotion: Decorator = (Story) => (
  <div style={slowMotionOverrides() as CSSProperties} className="grid gap-3">
    <p className="text-caption text-foreground-muted">
      Every duration multiplied by {SLOW_FACTOR}, by overriding the duration tokens on this subtree.
      Anything that still moves at full speed reached past a token for a raw value.
    </p>
    <Story />
  </div>
);
