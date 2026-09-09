import { cssVariable, rolesUnder, scalar } from "@/lib/tokens";
import { MotionDemoClient, type MotionDemoValues } from "./MotionDemoClient";

/**
 * Server half of the motion demo. It reads the motion tokens from the
 * published token JSON and hands the client half two things: the values to
 * display, and the override map that simulates `prefers-reduced-motion` on
 * one subtree.
 *
 * The overrides are built the same way the package's own reduced-motion rule
 * is: every duration role collapses to `duration.reduced`, every scale role
 * to `scale.reduced`, every distance role to `0px`. Nothing here is a raw
 * number that could drift from the stylesheet.
 */
export function MotionDemo() {
  const reduced: Record<string, string> = {};

  for (const { path, role } of rolesUnder("duration")) {
    if (role === "reduced") continue;
    reduced[cssVariable(path)] = scalar("duration.reduced");
  }
  for (const { path, role } of rolesUnder("scale")) {
    if (role === "reduced") continue;
    reduced[cssVariable(path)] = scalar("scale.reduced");
  }
  for (const { path } of rolesUnder("distance")) {
    reduced[cssVariable(path)] = "0px";
  }

  const values: MotionDemoValues = {
    pressDuration: scalar("duration.press-feedback"),
    pressScale: scalar("scale.press"),
    stateDuration: scalar("duration.state-change"),
    overlayEnter: scalar("duration.overlay-enter"),
    overlayExit: scalar("duration.overlay-exit"),
    overlayScale: scalar("scale.overlay-enter"),
    overlayDistance: scalar("distance.overlay"),
    reducedDuration: scalar("duration.reduced"),
    reducedScale: scalar("scale.reduced"),
  };

  return <MotionDemoClient reducedOverrides={reduced} values={values} />;
}
