import { cssVariable, rolesUnder, scalar } from "@/lib/tokens";

/**
 * The custom-property overrides that reproduce the package's reduced-motion
 * collapse on one subtree: every duration role to `duration.reduced`, every
 * scale role to `scale.reduced`, every distance role to `0px`.
 *
 * Built from the published token JSON, the same way the package stylesheet's
 * own `prefers-reduced-motion` rule is, so a new motion role is covered the
 * moment it exists and no value is restated where it could go stale. Server
 * safe: it reads `tokens.json`, never the package's JavaScript entry point.
 */
export function reducedMotionOverrides(): Record<string, string> {
  const overrides: Record<string, string> = {};

  for (const { path, role } of rolesUnder("duration")) {
    if (role === "reduced") continue;
    overrides[cssVariable(path)] = scalar("duration.reduced");
  }
  for (const { path, role } of rolesUnder("scale")) {
    if (role === "reduced") continue;
    overrides[cssVariable(path)] = scalar("scale.reduced");
  }
  for (const { path } of rolesUnder("distance")) {
    overrides[cssVariable(path)] = "0px";
  }

  return overrides;
}
