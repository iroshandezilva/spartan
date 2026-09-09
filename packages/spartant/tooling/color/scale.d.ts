/**
 * Deterministic OKLCH ramp generation.
 *
 * Every colour family in Spartant is produced by the same contract, so a
 * neutral and a danger ramp progress through lightness identically and a role
 * mapped to step 700 means the same weight whichever family it comes from.
 *
 * The policy behind these numbers is in ../../src/tokens/COLOR.md.
 */
import { type Oklch } from "./oklch.js";
/** The scale steps, lightest to darkest. Shared by every family. */
export declare const SCALE_STEPS: readonly [
  0,
  50,
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900,
  950,
  1000,
];
export type ScaleStep = (typeof SCALE_STEPS)[number];
/**
 * Target lightness per step, as a fraction.
 *
 * Fixed, not derived from the seed. That is the point: it is what makes step
 * 700 comparable across families, and what lets a theme swap a family without
 * re-checking every contrast pairing.
 */
export declare const LIGHTNESS: Record<ScaleStep, number>;
/**
 * Chroma as a fraction of the family's peak.
 *
 * Peaks in the middle and falls away at both ends, because a near-white or
 * near-black step holding full chroma reads as a colour cast rather than as a
 * light or dark neutral of that family.
 */
export declare const CHROMA_CURVE: Record<ScaleStep, number>;
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
export declare const MAX_HUE_SHIFT = 12;
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
export declare function generateScale(seed: FamilySeed): ScaleEntry[];
/** Generates every family in one pass, keyed by family name. */
export declare function generateFamilies(seeds: FamilySeed[]): Record<string, ScaleEntry[]>;
//# sourceMappingURL=scale.d.ts.map
