/**
 * Deterministic OKLCH ramp generation.
 *
 * Every colour family in Spartant is produced by the same contract, so a
 * neutral and a danger ramp progress through lightness identically and a role
 * mapped to step 700 means the same weight whichever family it comes from.
 *
 * The policy behind these numbers is in ../../src/tokens/COLOR.md.
 */

import { clampToSrgbGamut, formatOklch, isInSrgbGamut, type Oklch } from "./oklch.js";

/** The scale steps, lightest to darkest. Shared by every family. */
export const SCALE_STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000] as const;

export type ScaleStep = (typeof SCALE_STEPS)[number];

/**
 * Target lightness per step, as a fraction.
 *
 * Fixed, not derived from the seed. That is the point: it is what makes step
 * 700 comparable across families, and what lets a theme swap a family without
 * re-checking every contrast pairing.
 */
export const LIGHTNESS: Record<ScaleStep, number> = {
  0: 1.0,
  50: 0.98,
  100: 0.95,
  200: 0.91,
  300: 0.84,
  400: 0.74,
  500: 0.62,
  600: 0.54,
  700: 0.45,
  800: 0.35,
  900: 0.25,
  950: 0.19,
  1000: 0.12,
};

/**
 * Chroma as a fraction of the family's peak.
 *
 * Peaks in the middle and falls away at both ends, because a near-white or
 * near-black step holding full chroma reads as a colour cast rather than as a
 * light or dark neutral of that family.
 */
export const CHROMA_CURVE: Record<ScaleStep, number> = {
  0: 0.0,
  50: 0.06,
  100: 0.12,
  200: 0.24,
  300: 0.44,
  400: 0.72,
  500: 1.0,
  600: 0.98,
  700: 0.86,
  800: 0.66,
  900: 0.46,
  950: 0.34,
  1000: 0.18,
};

export interface FamilySeed {
  /** Family name, used as the token group. */
  name: string;
  /** Hue angle in degrees. */
  hue: number;
  /** Peak chroma, reached at step 500. */
  chroma: number;
  /**
   * Optional hue drift across the ramp, in degrees, applied linearly from the
   * lightest step to the darkest. Bounded, because a ramp that wanders in hue
   * stops reading as one family.
   */
  hueShift?: number;
}

/** The largest hue drift a family may declare. */
export const MAX_HUE_SHIFT = 12;

export interface ScaleEntry {
  step: ScaleStep;
  color: Oklch;
  css: string;
  /** True when the requested chroma had to be reduced to reach sRGB. */
  clamped: boolean;
  /** Chroma before gamut mapping, kept so the visualizer can show the cost. */
  requestedChroma: number;
}

/**
 * Generates one family's ramp.
 *
 * Deterministic: the same seed always produces the same output, with no
 * randomness, no clock, and no floating-point accumulation across steps.
 */
export function generateScale(seed: FamilySeed): ScaleEntry[] {
  if (seed.chroma < 0) throw new Error(`${seed.name}: chroma must not be negative`);
  const shift = seed.hueShift ?? 0;
  if (Math.abs(shift) > MAX_HUE_SHIFT) {
    throw new Error(`${seed.name}: hueShift ${shift} exceeds the ${MAX_HUE_SHIFT} degree limit`);
  }

  const last = SCALE_STEPS.length - 1;
  return SCALE_STEPS.map((step, index) => {
    const requestedChroma = seed.chroma * CHROMA_CURVE[step];
    const requested: Oklch = {
      l: LIGHTNESS[step],
      c: requestedChroma,
      h: (((seed.hue + (shift * index) / last) % 360) + 360) % 360,
    };
    const clamped = !isInSrgbGamut(requested);
    const color = clampToSrgbGamut(requested);
    return { step, color, css: formatOklch(color), clamped, requestedChroma };
  });
}

/** Generates every family in one pass, keyed by family name. */
export function generateFamilies(seeds: FamilySeed[]): Record<string, ScaleEntry[]> {
  return Object.fromEntries(seeds.map((seed) => [seed.name, generateScale(seed)]));
}
