import { describe, expect, it } from "vitest";
import {
  clampToSrgbGamut,
  contrastRatio,
  formatOklch,
  isInSrgbGamut,
  parseOklch,
  relativeLuminance,
  toHex,
} from "./oklch.js";

describe("conversion", () => {
  it("puts white and black at the ends of the luminance range", () => {
    expect(relativeLuminance({ l: 1, c: 0, h: 0 })).toBeCloseTo(1, 3);
    expect(relativeLuminance({ l: 0, c: 0, h: 0 })).toBeCloseTo(0, 5);
  });

  it("converts known achromatic colours to hex", () => {
    expect(toHex({ l: 1, c: 0, h: 0 })).toBe("#ffffff");
    expect(toHex({ l: 0, c: 0, h: 0 })).toBe("#000000");
  });

  it("round-trips through the CSS form", () => {
    const color = { l: 0.62, c: 0.19, h: 264 };
    expect(parseOklch(formatOklch(color))).toEqual(color);
  });

  it("rejects a value it did not produce", () => {
    expect(() => parseOklch("rgb(0 0 0)")).toThrow(/not a supported/i);
  });
});

describe("gamut", () => {
  it("accepts a colour inside sRGB", () => {
    expect(isInSrgbGamut({ l: 0.62, c: 0.1, h: 264 })).toBe(true);
  });

  it("rejects chroma no sRGB display can show", () => {
    expect(isInSrgbGamut({ l: 0.62, c: 0.4, h: 264 })).toBe(false);
  });

  it("reduces chroma while holding lightness and hue", () => {
    const requested = { l: 0.62, c: 0.4, h: 264 };
    const mapped = clampToSrgbGamut(requested);
    expect(mapped.l).toBe(requested.l);
    expect(mapped.h).toBe(requested.h);
    expect(mapped.c).toBeLessThan(requested.c);
    expect(isInSrgbGamut(mapped)).toBe(true);
  });

  it("leaves an in-gamut colour untouched", () => {
    const color = { l: 0.62, c: 0.1, h: 264 };
    expect(clampToSrgbGamut(color)).toEqual(color);
  });

  it("is deterministic", () => {
    const color = { l: 0.5, c: 0.35, h: 27 };
    expect(clampToSrgbGamut(color)).toEqual(clampToSrgbGamut(color));
  });
});

describe("contrast", () => {
  it("gives 21:1 for black on white", () => {
    const ratio = contrastRatio({ l: 0, c: 0, h: 0 }, { l: 1, c: 0, h: 0 });
    expect(ratio).toBeCloseTo(21, 1);
  });

  it("gives 1:1 for a colour against itself", () => {
    const color = { l: 0.5, c: 0.1, h: 200 };
    expect(contrastRatio(color, color)).toBeCloseTo(1, 5);
  });

  it("does not depend on argument order", () => {
    const a = { l: 0.25, c: 0.01, h: 264 };
    const b = { l: 0.98, c: 0.002, h: 264 };
    expect(contrastRatio(a, b)).toBeCloseTo(contrastRatio(b, a), 10);
  });
});
