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

/** Chroma reduction never runs more than this many bisection steps. */
const GAMUT_ITERATIONS = 24;

/** How close to the gamut boundary the search must land. */
const GAMUT_EPSILON = 1e-5;

/** Components may sit this far outside 0 to 1 and still count as in gamut. */
const GAMUT_TOLERANCE = 1e-6;

/** Decimal places chroma is emitted with. Must match formatOklch. */
const CHROMA_DIGITS = 4;
const CHROMA_PRECISION = 10 ** CHROMA_DIGITS;

export function oklchToLinearRgb({ l, c, h }: Oklch): LinearRgb {
  const hRad = (h * Math.PI) / 180;
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);

  const lCone = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mCone = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sCone = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return {
    r: 4.0767416621 * lCone - 3.3077115913 * mCone + 0.2309699292 * sCone,
    g: -1.2684380046 * lCone + 2.6097574011 * mCone - 0.3413193965 * sCone,
    b: -0.0041960863 * lCone - 0.7034186147 * mCone + 1.707614701 * sCone,
  };
}

/** Applies the sRGB transfer function to one linear component. */
function encodeSrgb(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const magnitude = Math.abs(value);
  return magnitude <= 0.0031308 ? value * 12.92 : sign * (1.055 * magnitude ** (1 / 2.4) - 0.055);
}

/** True when every component sits inside the sRGB cube. */
export function isInSrgbGamut(color: Oklch): boolean {
  const { r, g, b } = oklchToLinearRgb(color);
  return [r, g, b].every(
    (channel) => channel >= -GAMUT_TOLERANCE && channel <= 1 + GAMUT_TOLERANCE,
  );
}

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
export function clampToSrgbGamut(color: Oklch): Oklch {
  if (isInSrgbGamut(color)) return color;

  let low = 0;
  let high = color.c;
  for (let i = 0; i < GAMUT_ITERATIONS && high - low > GAMUT_EPSILON; i += 1) {
    const mid = (low + high) / 2;
    if (isInSrgbGamut({ ...color, c: mid })) low = mid;
    else high = mid;
  }

  // The bisection result is in gamut at full precision, but the value that
  // actually ships is the rounded one from formatOklch. Rounding chroma up
  // pushes it back outside, which is subtle and real: it produced an
  // out-of-gamut token that only the audit caught. Settle on a chroma whose
  // rounded form is in gamut, so what is written is what was checked.
  let chroma = Math.floor(low * CHROMA_PRECISION) / CHROMA_PRECISION;
  while (chroma > 0 && !isInSrgbGamut({ ...color, c: chroma })) {
    chroma = Number((chroma - 1 / CHROMA_PRECISION).toFixed(CHROMA_DIGITS));
  }
  return { ...color, c: Math.max(0, chroma) };
}

/** Formats as a CSS `oklch()` value, rounded so output is stable across runs. */
export function formatOklch({ l, c, h }: Oklch): string {
  const lightness = Number((l * 100).toFixed(2));
  const chroma = Number(c.toFixed(CHROMA_DIGITS));
  const hue = Number(h.toFixed(2));
  return `oklch(${lightness}% ${chroma} ${hue})`;
}

/** Parses the `oklch()` form this module emits. */
export function parseOklch(value: string): Oklch {
  const match = value.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+\s*)?\)$/);
  if (!match) throw new Error(`Not a supported oklch() value: ${value}`);
  return { l: Number(match[1]) / 100, c: Number(match[2]), h: Number(match[3]) };
}

/**
 * WCAG 2.2 relative luminance.
 *
 * Taken from linear-light sRGB directly, which is what the definition asks for,
 * rather than round-tripping through the encoded form and back.
 */
export function relativeLuminance(color: Oklch): number {
  const { r, g, b } = oklchToLinearRgb(clampToSrgbGamut(color));
  const clamp = (channel: number) => Math.min(1, Math.max(0, channel));
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b);
}

/** WCAG 2.2 contrast ratio, 1 to 21. Order of the arguments does not matter. */
export function contrastRatio(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Hex form, for fixtures and for anything that cannot read `oklch()`. */
export function toHex(color: Oklch): string {
  const { r, g, b } = oklchToLinearRgb(clampToSrgbGamut(color));
  const channel = (value: number) =>
    Math.round(Math.min(1, Math.max(0, encodeSrgb(value))) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}
