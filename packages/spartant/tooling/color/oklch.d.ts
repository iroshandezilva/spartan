/**
 * Colour maths for the token pipeline.
 *
 * Build-time tooling. It lives outside `src/` so it never reaches the published
 * package, and it has no dependencies: the conversions are short, and a
 * dependency here would sit in the trust path of every colour decision.
 *
 * Conversion follows Björn Ottosson's OKLab definition and the sRGB transfer
 * function from IEC 61966-2-1.
 */
export interface Oklch {
  /** Perceptual lightness, 0 to 1. */
  l: number;
  /** Chroma, 0 upward. Values above roughly 0.37 leave sRGB at any hue. */
  c: number;
  /** Hue angle in degrees, 0 to 360. */
  h: number;
}
/** Linear-light sRGB, before the transfer function. Values may fall outside 0 to 1. */
export interface LinearRgb {
  r: number;
  g: number;
  b: number;
}
export declare function oklchToLinearRgb({ l, c, h }: Oklch): LinearRgb;
/** True when every component sits inside the sRGB cube. */
export declare function isInSrgbGamut(color: Oklch): boolean;
/**
 * Brings a colour into sRGB by reducing chroma, holding lightness and hue.
 *
 * Lightness and hue are what carry meaning in a semantic scale: a role must
 * stay the same hue and keep its position in the light progression, or the
 * ramp stops being a ramp. Chroma is the only axis that can give way, so the
 * search bisects on chroma alone and is deterministic to a fixed tolerance.
 *
 * Clipping RGB channels instead would shift both hue and lightness, which is
 * why it is not the policy.
 */
export declare function clampToSrgbGamut(color: Oklch): Oklch;
/** Formats as a CSS `oklch()` value, rounded so output is stable across runs. */
export declare function formatOklch({ l, c, h }: Oklch): string;
/** Parses the `oklch()` form this module emits. */
export declare function parseOklch(value: string): Oklch;
/**
 * WCAG 2.2 relative luminance.
 *
 * Taken from linear-light sRGB directly, which is what the definition asks for,
 * rather than round-tripping through the encoded form and back.
 */
export declare function relativeLuminance(color: Oklch): number;
/** WCAG 2.2 contrast ratio, 1 to 21. Order of the arguments does not matter. */
export declare function contrastRatio(a: Oklch, b: Oklch): number;
/** Hex form, for fixtures and for anything that cannot read `oklch()`. */
export declare function toHex(color: Oklch): string;
//# sourceMappingURL=oklch.d.ts.map
