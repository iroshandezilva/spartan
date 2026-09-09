/**
 * WCAG 2.2 contrast from `oklch()` values.
 *
 * This is the same arithmetic the package's colour audit runs in
 * `packages/spartant/tooling/color/oklch.ts`: Ottosson's OKLab conversion, the
 * sRGB matrix, and relative luminance taken from linear light. The tooling is
 * build-time only and is not a package export, so the documentation carries
 * its own copy rather than reaching into the package's source. The formula is
 * a published standard and the inputs are the published token values, so the
 * figures on the Color page are the figures the audit measures.
 */

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

interface LinearRgb {
  r: number;
  g: number;
  b: number;
}

const GAMUT_ITERATIONS = 24;
const GAMUT_EPSILON = 1e-5;
const GAMUT_TOLERANCE = 1e-6;
const CHROMA_PRECISION = 10 ** 4;

export function parseOklch(value: string): Oklch {
  const match = value.match(/^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*[\d.]+\s*)?\)$/);
  if (!match) throw new Error(`Not a supported oklch() value: ${value}`);
  return { l: Number(match[1]) / 100, c: Number(match[2]), h: Number(match[3]) };
}

function oklchToLinearRgb({ l, c, h }: Oklch): LinearRgb {
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

function isInSrgbGamut(color: Oklch): boolean {
  const { r, g, b } = oklchToLinearRgb(color);
  return [r, g, b].every(
    (channel) => channel >= -GAMUT_TOLERANCE && channel <= 1 + GAMUT_TOLERANCE,
  );
}

/** Reduces chroma until the colour fits sRGB, holding lightness and hue. */
function clampToSrgbGamut(color: Oklch): Oklch {
  if (isInSrgbGamut(color)) return color;

  let low = 0;
  let high = color.c;
  for (let i = 0; i < GAMUT_ITERATIONS && high - low > GAMUT_EPSILON; i += 1) {
    const mid = (low + high) / 2;
    if (isInSrgbGamut({ ...color, c: mid })) low = mid;
    else high = mid;
  }

  let chroma = Math.floor(low * CHROMA_PRECISION) / CHROMA_PRECISION;
  while (chroma > 0 && !isInSrgbGamut({ ...color, c: chroma })) {
    chroma = Number((chroma - 1 / CHROMA_PRECISION).toFixed(4));
  }
  return { ...color, c: Math.max(0, chroma) };
}

function encodeSrgb(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const magnitude = Math.abs(value);
  return magnitude <= 0.0031308 ? value * 12.92 : sign * (1.055 * magnitude ** (1 / 2.4) - 0.055);
}

function relativeLuminance(color: Oklch): number {
  const { r, g, b } = oklchToLinearRgb(clampToSrgbGamut(color));
  const clamp = (channel: number) => Math.min(1, Math.max(0, channel));
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b);
}

/** WCAG 2.2 contrast ratio between two `oklch()` strings, rounded to two places. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(parseOklch(a));
  const lb = relativeLuminance(parseOklch(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/** Hex form of an `oklch()` string, for readers and tools that cannot parse OKLCH. */
export function toHex(value: string): string {
  const { r, g, b } = oklchToLinearRgb(clampToSrgbGamut(parseOklch(value)));
  const channel = (component: number) =>
    Math.round(Math.min(1, Math.max(0, encodeSrgb(component))) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}
