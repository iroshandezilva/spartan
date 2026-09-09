import { describe, expect, it } from "vitest";
import { contrastRatio, isInSrgbGamut, parseOklch } from "./oklch.js";
import type { FamilySeed } from "./scale.js";
import { generateScale, LIGHTNESS, MAX_HUE_SHIFT, SCALE_STEPS } from "./scale.js";
import { EXAMPLE_SEEDS } from "./seeds.js";

/** Throws rather than falling back, so a typo in a test name fails loudly. */
function seed(name: string): FamilySeed {
  const found = EXAMPLE_SEEDS.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`No example seed named ${name}`);
  return found;
}

describe("the scale contract", () => {
  it.each(EXAMPLE_SEEDS.map((s) => s.name))("%s has every step", (name) => {
    const scale = generateScale(seed(name));
    expect(scale.map((entry) => entry.step)).toEqual([...SCALE_STEPS]);
  });

  it.each(EXAMPLE_SEEDS.map((s) => s.name))("%s decreases in lightness", (name) => {
    const values = generateScale(seed(name)).map((entry) => entry.color.l);
    const pairs = values.slice(1).map((value, index) => [values[index], value] as const);
    for (const [previous, current] of pairs) {
      expect(current).toBeLessThan(Number(previous));
    }
  });

  it.each(EXAMPLE_SEEDS.map((s) => s.name))("%s hits the shared lightness targets", (name) => {
    for (const entry of generateScale(seed(name))) {
      expect(entry.color.l).toBe(LIGHTNESS[entry.step]);
    }
  });

  it.each(EXAMPLE_SEEDS.map((s) => s.name))("%s stays inside sRGB", (name) => {
    for (const entry of generateScale(seed(name))) {
      expect(isInSrgbGamut(entry.color)).toBe(true);
    }
  });

  it("puts the same step at the same lightness across families", () => {
    const at700 = EXAMPLE_SEEDS.map(
      (s) => generateScale(s).find((entry) => entry.step === 700)?.color.l,
    );
    expect(new Set(at700).size).toBe(1);
  });

  it("is deterministic", () => {
    expect(generateScale(seed("primary"))).toEqual(generateScale(seed("primary")));
  });

  it("holds hue when no shift is declared", () => {
    const primary: FamilySeed = seed("primary");
    for (const entry of generateScale(primary)) {
      expect(entry.color.h).toBe(primary.hue);
    }
  });

  it("applies a declared hue shift across the ramp", () => {
    const scale = generateScale({ name: "drift", hue: 200, chroma: 0.1, hueShift: 10 });
    const first = scale.at(0);
    const last = scale.at(-1);
    if (!first || !last) throw new Error("scale is empty");
    expect(first.color.h).toBe(200);
    expect(last.color.h).toBeCloseTo(210, 6);
  });

  it("rejects a hue shift beyond the limit", () => {
    expect(() =>
      generateScale({ name: "wild", hue: 200, chroma: 0.1, hueShift: MAX_HUE_SHIFT + 1 }),
    ).toThrow(/exceeds/);
  });

  it("rejects negative chroma", () => {
    expect(() => generateScale({ name: "bad", hue: 0, chroma: -1 })).toThrow(/negative/);
  });

  it.each(EXAMPLE_SEEDS.map((s) => s.name))(
    "%s stays in gamut after the value is rounded for output",
    (name) => {
      // Clamping at full precision is not enough: what ships is the rounded
      // form, so the rounded form is what must be in gamut.
      for (const entry of generateScale(seed(name))) {
        expect(isInSrgbGamut(parseOklch(entry.css))).toBe(true);
      }
    },
  );

  it("records when gamut mapping reduced the requested chroma", () => {
    const scale = generateScale({ name: "vivid", hue: 264, chroma: 0.5 });
    const clamped = scale.filter((entry) => entry.clamped);
    expect(clamped.length).toBeGreaterThan(0);
    for (const entry of clamped) {
      expect(entry.color.c).toBeLessThan(entry.requestedChroma);
    }
  });
});

describe("expected contrast outcomes", () => {
  // Fixtures with expected outcomes, per this issue's automated verification.
  // Steps far apart on the shared lightness ramp must clear body text; steps
  // close together must not. This is what makes the ramp usable for mapping.
  const neutral = generateScale(seed("neutral"));
  const at = (step: number) => {
    const found = neutral.find((entry) => entry.step === step);
    if (!found) throw new Error(`no step ${step}`);
    return found.color;
  };

  it.each([
    [900, 50, 4.5],
    [1000, 0, 4.5],
    [800, 100, 4.5],
  ])("step %i on step %i clears body text", (fg, bg, min) => {
    expect(contrastRatio(at(fg), at(bg))).toBeGreaterThanOrEqual(min);
  });

  it.each([
    [500, 400],
    [300, 200],
  ])("adjacent steps %i and %i do not clear body text", (fg, bg) => {
    expect(contrastRatio(at(fg), at(bg))).toBeLessThan(4.5);
  });

  it("clears the non-text threshold for a mid-scale border on a light surface", () => {
    expect(contrastRatio(at(500), at(50))).toBeGreaterThanOrEqual(3);
  });
});
