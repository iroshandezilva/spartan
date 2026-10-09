// The runtime styling contract. A theme is five independent settings, each carried by one
// attribute that the generated token CSS (public/tokens.css) reads. High contrast is a boolean on
// its own: it is never part of the color scheme, so it composes with every style and both schemes.
// The attribute names and values are checked against tokens/source.json by a test.

export const STYLES = ['Atlas', 'Selene', 'Helios', 'Ares'] as const;
export const COLOR_SCHEMES = ['Light', 'Dark'] as const;
export const HUES = ['Blue', 'Purple', 'Orange', 'Sky'] as const;
export const DENSITIES = ['Relaxed', 'Compact'] as const;

export type SpartanStyle = (typeof STYLES)[number];
export type ColorScheme = (typeof COLOR_SCHEMES)[number];
export type Hue = (typeof HUES)[number];
export type Density = (typeof DENSITIES)[number];

/**
 * Every field is optional: only the fields you pass change, and the rest are left as they are.
 * Pass `null` to remove a setting from an element so it inherits from its ancestors again.
 * Defaults, with no attribute anywhere: Atlas, Light, normal contrast, Blue, Relaxed.
 */
export interface ThemeConfig {
  style?: SpartanStyle | null;
  colorScheme?: ColorScheme | null;
  /** On or off, independent of the color scheme and style. */
  highContrast?: boolean | null;
  hue?: Hue | null;
  density?: Density | null;
}

export const THEME_ATTRIBUTES = {
  style: 'data-sp-mode-style',
  colorScheme: 'data-sp-mode-color-scheme',
  contrast: 'data-sp-mode-contrast',
  hue: 'data-sp-mode-primary',
  density: 'data-sp-mode-density',
} as const;

const oneOf = <T extends string>(name: string, allowed: readonly T[], value: unknown): T => {
  if (!allowed.includes(value as T)) throw new Error(`Invalid ${name} ${JSON.stringify(value)}. Expected one of ${allowed.join(', ')}.`);
  return value as T;
};

type AttributeTarget = Pick<Element, 'setAttribute' | 'removeAttribute' | 'getAttribute'>;

/**
 * Applies theme settings to an element, usually `document.documentElement` or a wrapper.
 * Settings are independent and inherit: setting one on a nested element changes only that setting
 * for its subtree and keeps every other setting from the ancestors.
 */
export function applyTheme(target: AttributeTarget, config: ThemeConfig): void {
  const set = (attribute: string, value: string | null | undefined) => {
    if (value === undefined) return;
    if (value === null) target.removeAttribute(attribute);
    else target.setAttribute(attribute, value);
  };
  // Validate everything first so a bad value changes nothing.
  const next = {
    style: config.style == null ? config.style : oneOf('style', STYLES, config.style),
    colorScheme: config.colorScheme == null ? config.colorScheme : oneOf('color scheme', COLOR_SCHEMES, config.colorScheme),
    hue: config.hue == null ? config.hue : oneOf('hue', HUES, config.hue),
    density: config.density == null ? config.density : oneOf('density', DENSITIES, config.density),
  };
  if (config.highContrast != null && typeof config.highContrast !== 'boolean') throw new Error(`Invalid highContrast ${JSON.stringify(config.highContrast)}. Expected true or false.`);
  set(THEME_ATTRIBUTES.style, next.style);
  set(THEME_ATTRIBUTES.colorScheme, next.colorScheme);
  set(THEME_ATTRIBUTES.hue, next.hue);
  set(THEME_ATTRIBUTES.density, next.density);
  if (config.highContrast !== undefined) set(THEME_ATTRIBUTES.contrast, config.highContrast === null ? null : config.highContrast ? 'High' : 'Normal');
}

/** The settings explicitly set on one element. Settings it inherits are left out. */
export function readTheme(target: AttributeTarget): ThemeConfig {
  const out: ThemeConfig = {};
  const style = target.getAttribute(THEME_ATTRIBUTES.style);
  const scheme = target.getAttribute(THEME_ATTRIBUTES.colorScheme);
  const contrast = target.getAttribute(THEME_ATTRIBUTES.contrast);
  const hue = target.getAttribute(THEME_ATTRIBUTES.hue);
  const density = target.getAttribute(THEME_ATTRIBUTES.density);
  if (style !== null) out.style = oneOf('style', STYLES, style);
  if (scheme !== null) out.colorScheme = oneOf('color scheme', COLOR_SCHEMES, scheme);
  if (contrast !== null) out.highContrast = oneOf('contrast', ['Normal', 'High'] as const, contrast) === 'High';
  if (hue !== null) out.hue = oneOf('hue', HUES, hue);
  if (density !== null) out.density = oneOf('density', DENSITIES, density);
  return out;
}

const LEGACY_THEMES = {
  Light: { colorScheme: 'Light', highContrast: false },
  Dark: { colorScheme: 'Dark', highContrast: false },
  'Light High Contrast': { colorScheme: 'Light', highContrast: true },
  'Dark High Contrast': { colorScheme: 'Dark', highContrast: true },
} as const satisfies Record<string, Required<Pick<ThemeConfig, 'colorScheme' | 'highContrast'>>>;

/**
 * Migration for the earlier combined theme values (the Figma Semantic Color modes, and the old
 * `data-sp-mode-semantic-color` attribute): `'Dark High Contrast'` becomes
 * `{ colorScheme: 'Dark', highContrast: true }`.
 */
export function fromLegacyTheme(mode: string): { colorScheme: ColorScheme; highContrast: boolean } {
  if (!Object.hasOwn(LEGACY_THEMES, mode)) throw new Error(`Unknown legacy theme ${JSON.stringify(mode)}. Expected one of ${Object.keys(LEGACY_THEMES).join(', ')}.`);
  return { ...LEGACY_THEMES[mode as keyof typeof LEGACY_THEMES] };
}
