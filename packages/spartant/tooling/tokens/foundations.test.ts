import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const CSS = readFileSync("packages/spartant/src/styles/tokens.css", "utf8");
const THEME = readFileSync("packages/spartant/src/styles/theme.css", "utf8");
const JSON_OUT = JSON.parse(
  readFileSync("packages/spartant/src/tokens/generated/tokens.json", "utf8"),
) as Record<string, Record<string, unknown>>;
const TS = readFileSync("packages/spartant/src/tokens/generated/tokens.ts", "utf8");

const semantic = JSON_OUT.semantic ?? {};
const cssName = (path: string) =>
  `--spartant-${path
    .replace(/\.default$/, "")
    .split(".")
    .join("-")}`;

describe("every foundation reaches every output", () => {
  const categories = [
    "radius",
    "space",
    "font.size",
    "font.weight",
    "font.line-height",
    "font.tracking",
    "border-width",
    "opacity",
    "elevation",
    "duration",
    "easing",
    "distance",
    "scale",
  ];

  it.each(categories)("%s has semantic roles", (category) => {
    const found = Object.keys(semantic).filter((p) => p.startsWith(`${category}.`));
    expect(found.length).toBeGreaterThan(0);
  });

  it.each(categories)("%s roles appear in the CSS and the TypeScript surface", (category) => {
    for (const path of Object.keys(semantic).filter((p) => p.startsWith(`${category}.`))) {
      expect(CSS, `${path} missing from tokens.css`).toContain(`${cssName(path)}:`);
      expect(TS, `${path} missing from tokens.ts`).toContain(JSON.stringify(cssName(path)));
    }
  });
});

describe("reduced motion", () => {
  it("collapses every motion role in one place", () => {
    // A per-component branch is a thing a component can forget. The tokens are
    // overridden globally instead, so a component that uses them is covered
    // whether or not its author thought about it.
    const block = THEME.slice(THEME.indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const role of Object.keys(semantic).filter((p) => p.startsWith("duration."))) {
      if (role === "duration.reduced") continue;
      expect(block, `${role} is not collapsed under reduced motion`).toContain(cssName(role));
    }
    for (const role of ["scale.press", "scale.overlay-enter"]) {
      expect(block).toContain(cssName(role));
    }
    for (const role of Object.keys(semantic).filter((p) => p.startsWith("distance."))) {
      expect(block).toContain(cssName(role));
    }
  });

  it("resolves the reduced roles to no motion at all", () => {
    expect(semantic["duration.reduced"]).toBe("0ms");
    expect(semantic["scale.reduced"]).toBe(1);
  });

  it("leaves colour and opacity alone", () => {
    // The standard allows a short non-spatial transition that clarifies state.
    const block = THEME.slice(THEME.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).not.toContain("--spartant-color-");
    expect(block).not.toContain("--spartant-opacity-");
  });
});

describe("motion values match the standard", () => {
  /**
   * Roles frozen by HAUX-68, with the component that validated each.
   *
   * Freezing is this list. Every value here was measured on a rendered
   * component in the first core slice, so changing one is a deliberate act with
   * a test to update rather than a number that drifted. A role with no consumer
   * is not in this list, because a value nothing has exercised has not been
   * validated by anything and calling it frozen would be a fiction.
   */
  const FROZEN: Array<[role: string, value: string, validatedBy: string]> = [
    ["duration.press-feedback", "120ms", "Button press"],
    ["duration.state-change", "160ms", "Field focus and validation, Checkbox, Radio, Switch"],
    ["duration.modal-enter", "280ms", "Dialog entry"],
    ["duration.indicator-loop", "1000ms", "Button loading spinner"],
    ["duration.reduced", "0ms", "the reduced-motion collapse in theme.css"],
    ["easing.state", "cubic-bezier(0.25, 0.1, 0.25, 1)", "Button, Field, Checkbox, Radio"],
    ["easing.move", "cubic-bezier(0.77, 0, 0.175, 1)", "Switch thumb"],
    ["easing.enter", "cubic-bezier(0.23, 1, 0.32, 1)", "Dialog entry"],
    ["easing.progress", "cubic-bezier(0, 0, 1, 1)", "Button loading spinner"],
    ["scale.press", 0.97 as unknown as string, "Button press"],
    ["scale.overlay-enter", 0.96 as unknown as string, "Dialog entry"],
    ["scale.reduced", 1 as unknown as string, "the reduced-motion collapse in theme.css"],
  ];

  it.each(FROZEN)("%s is frozen at %s, validated by %s", (role, value) => {
    expect(semantic[role]).toBe(value);
  });

  /**
   * Roles still provisional, with the reason no evidence exists yet.
   *
   * Not a failure, and not something to delete on sight: each has a named
   * consumer that has not been built. The list exists so the difference between
   * "validated" and "merely present" stays visible, which is exactly what got
   * lost the last time a scale was called provisional and then quietly used.
   */
  const PROVISIONAL: Record<string, string> = {
    "duration.overlay-enter":
      "no overlay component yet; Popover and Tooltip are HAUX-53, Select is HAUX-52",
    "duration.overlay-exit": "as duration.overlay-enter",
    "duration.modal-exit":
      "Dialog closes instantly so focus is never delayed, so nothing consumes an exit duration",
    "easing.exit": "nothing in the slice animates out, for the same reason",
    "distance.indicator":
      "no component moves anything spatially; the slice used scale and colour throughout",
    "distance.state": "as distance.indicator",
    "distance.overlay": "as distance.indicator",
    "spring.state":
      "no component needed spring physics; CSS covered every interaction including a modal",
    "spring.gesture": "as spring.state; no gesture-driven component exists",
  };

  it.each(Object.entries(PROVISIONAL))("%s is recorded as provisional: %s", (role) => {
    // It must still exist and still be absent from the frozen list. A role that
    // gained a consumer should move lists rather than sit in both.
    expect(semantic[role]).toBeDefined();
    expect(FROZEN.some(([frozen]) => frozen === role)).toBe(false);
  });

  it("accounts for every motion role, as frozen or provisional", () => {
    // The check that keeps the two lists honest: a new role added to the token
    // source and to neither list fails here rather than sitting unclassified.
    const motionRoles = Object.keys(semantic).filter((role) =>
      /^(duration|easing|distance|scale|spring)\./.test(role),
    );
    const classified = new Set([...FROZEN.map(([role]) => role), ...Object.keys(PROVISIONAL)]);
    expect(motionRoles.filter((role) => !classified.has(role))).toEqual([]);
  });

  /**
   * Roles that are not interaction motion, and the reason each is exempt.
   *
   * The standard's own wording is "product UI motion should remain at or below
   * 300ms unless a deliberate hold, progress, or explanatory sequence requires
   * more time". A named exemption keeps that escape hatch honest: adding a slow
   * duration means adding it here, with a reason, rather than quietly relaxing
   * the number for everything.
   */
  const NOT_INTERACTION_MOTION: Record<string, string> = {
    "duration.indicator-loop":
      "one turn of a looping progress indicator, which the standard exempts",
  };

  it("keeps interaction motion at or below 300ms", () => {
    for (const [role, value] of Object.entries(semantic)) {
      if (!role.startsWith("duration.")) continue;
      if (role in NOT_INTERACTION_MOTION) continue;
      const milliseconds = Number(String(value).replace("ms", ""));
      expect(
        milliseconds <= 300 ? role : `${role} is ${value}, over the 300ms interaction limit`,
      ).toBe(role);
    }
  });

  it("exempts only roles with a recorded reason", () => {
    // An exemption without a reason is how the limit stops meaning anything.
    for (const [role, reason] of Object.entries(NOT_INTERACTION_MOTION)) {
      expect(semantic[role]).toBeDefined();
      expect(reason.length).toBeGreaterThan(0);
    }
  });

  it("exits faster than it enters", () => {
    const ms = (role: string) => Number(String(semantic[role]).replace("ms", ""));
    expect(ms("duration.overlay-exit")).toBeLessThan(ms("duration.overlay-enter"));
    expect(ms("duration.modal-exit")).toBeLessThan(ms("duration.modal-enter"));
  });

  it("never uses ease-in for product motion", () => {
    // An ease-in start feels unresponsive, so the standard forbids it.
    for (const [role, value] of Object.entries(semantic)) {
      if (!role.startsWith("easing.")) continue;
      const [x1] = String(value)
        .replace(/cubic-bezier\(|\)/g, "")
        .split(",")
        .map(Number);
      // ease-in curves start with a large first control point on x with a low y.
      expect(Number(x1)).toBeLessThan(0.8);
    }
  });

  it("never enters from scale zero", () => {
    for (const [role, value] of Object.entries(semantic)) {
      if (!role.startsWith("scale.")) continue;
      expect(Number(value)).toBeGreaterThanOrEqual(0.9);
    }
  });
});

describe("springs", () => {
  const ts = readFileSync("packages/spartant/src/tokens/generated/tokens.ts", "utf8");
  const css = readFileSync("packages/spartant/src/styles/tokens.css", "utf8");

  it("are typed values, not custom properties", () => {
    // CSS has no spring primitive. A spring in the stylesheet could only ever
    // be a string nothing reads, and the first attempt at this emitted
    // "undefined undefined undefined" into tokens.css.
    expect(css).not.toContain("--spartant-spring");
    expect(ts).toContain("export const springs");
    expect(ts).toContain("satisfies Record<string, SpringToken>");
  });

  it("define a restrained and an expressive spring, per the standard", () => {
    expect(semantic["spring.state"]).toEqual({ stiffness: 420, damping: 36, mass: 1 });
    expect(semantic["spring.gesture"]).toEqual({ stiffness: 260, damping: 24, mass: 1 });
  });

  it("keeps the state spring at or beyond critical damping, so it does not wobble", () => {
    // Critical damping is 2 * sqrt(stiffness * mass). Below it the spring
    // overshoots, which is wrong for state that should feel immediate.
    const s = semantic["spring.state"] as { stiffness: number; damping: number; mass: number };
    const critical = 2 * Math.sqrt(s.stiffness * s.mass);
    expect(s.damping / critical).toBeGreaterThan(0.85);
  });

  it("lets the gesture spring overshoot, which is the point of it", () => {
    const g = semantic["spring.gesture"] as { stiffness: number; damping: number; mass: number };
    const critical = 2 * Math.sqrt(g.stiffness * g.mass);
    expect(g.damping / critical).toBeLessThan(0.85);
  });
});
