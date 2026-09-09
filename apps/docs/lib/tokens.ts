/**
 * Token access for the foundation pages.
 *
 * Everything here reads the published artefact `tokens.json` through the
 * package's public subpath export. The pages never restate a value, so they
 * cannot show something the package does not ship, and a token change shows
 * up here on the next build with no edit.
 *
 * The package's JavaScript entry point is deliberately not imported here.
 * These helpers run inside React Server Components, and the entry point
 * re-exports `ThemeProvider`, whose hooks the server compiler rejects. The
 * custom property names are therefore derived from the token grammar, which
 * the token specification defines as mechanical with no special cases.
 */

import artifact from "@iroshandezilva/spartant/tokens.json";

export interface ShadowValue {
  color: string;
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
}

export interface SpringValue {
  stiffness: number;
  damping: number;
  mass: number;
}

export type TokenValue = string | number | ShadowValue | SpringValue;

interface TokenArtifact {
  primitive: Record<string, TokenValue>;
  semantic: Record<string, TokenValue>;
  component: Record<string, TokenValue>;
  /** Dark theme overrides. Only the roles that differ from light appear here. */
  theme: Record<string, TokenValue>;
}

const tokens = artifact as unknown as TokenArtifact;

export const primitiveTokens = tokens.primitive;
export const semanticValues = tokens.semantic;
export const componentTokens = tokens.component;
export const darkOverrides = tokens.theme;

export interface Role {
  /** Full semantic path, for example `color.foreground.muted`. */
  path: string;
  /** The path with the category prefix removed, for example `foreground.muted`. */
  role: string;
  value: TokenValue;
}

/** Semantic roles under a prefix, sorted by path. */
export function rolesUnder(prefix: string): Role[] {
  return Object.entries(semanticValues)
    .filter(([path]) => path.startsWith(`${prefix}.`))
    .map(([path, value]) => ({ path, role: path.slice(prefix.length + 1), value }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

/** The resolved value of one semantic role. Throws so a renamed token fails the build. */
export function semanticValue(path: string): TokenValue {
  const value = semanticValues[path];
  if (value === undefined) throw new Error(`No semantic token at ${path}`);
  return value;
}

/** A scalar semantic value as a CSS-ready string. */
export function scalar(path: string): string {
  const value = semanticValue(path);
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  throw new Error(`${path} is not a scalar token`);
}

/**
 * The custom property carrying a semantic role, for example
 * `--spartant-color-primary`.
 *
 * `--spartant-` plus the path with dots replaced by hyphens and a trailing
 * `.default` removed, which is the grammar in the package's token README and
 * what the generator emits as `semanticTokens`. Throws for a path that is not
 * a semantic token, so a renamed role fails the build rather than rendering an
 * empty property.
 */
export function cssVariable(path: string): string {
  if (!(path in semanticValues)) throw new Error(`No semantic token at ${path}`);
  return `--spartant-${path
    .replace(/\.default$/, "")
    .split(".")
    .join("-")}`;
}

/** `var(--spartant-...)` for a semantic role. */
export function cssVar(path: string): string {
  return `var(${cssVariable(path)})`;
}

export interface ColorRole {
  path: string;
  role: string;
  variable: string;
  light: string;
  dark: string;
}

/** A colour role with its resolved light and dark values. */
export function colorRole(path: string): ColorRole {
  const light = semanticValues[path];
  if (typeof light !== "string") throw new Error(`${path} is not a colour role`);
  const override = darkOverrides[path];
  const dark = typeof override === "string" ? override : light;
  return {
    path,
    role: path.replace(/^color\./, ""),
    variable: cssVariable(path),
    light,
    dark,
  };
}

/** Every colour role whose path starts with `color.<group>.`. */
export function colorRoles(group: string): ColorRole[] {
  return rolesUnder(`color.${group}`).map(({ path }) => colorRole(path));
}

/**
 * A rem value as pixels at the browser default of 16px, for the reader who
 * thinks in pixels. Returns the input unchanged when it is not a rem length.
 */
export function remToPx(value: string): string {
  const match = value.match(/^(-?[\d.]+)rem$/);
  if (!match) return value;
  const px = Number(match[1]) * 16;
  return `${Number.isInteger(px) ? px : Number(px.toFixed(2))}px`;
}

/** A DTCG shadow as the `box-shadow` string the stylesheet emits. */
export function shadowToCss(shadow: ShadowValue): string {
  return `${shadow.offsetX} ${shadow.offsetY} ${shadow.blur} ${shadow.spread} ${shadow.color}`;
}

export function isShadow(value: TokenValue): value is ShadowValue {
  return typeof value === "object" && "blur" in value;
}

export function isSpring(value: TokenValue): value is SpringValue {
  return typeof value === "object" && "stiffness" in value;
}
