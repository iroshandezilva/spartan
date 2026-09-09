/**
 * The foundation roles this specimen renders, read from the published token
 * JSON so the page can never show a value the package does not ship.
 */

import tokens from "@iroshandezilva/spartant/tokens.json" with { type: "json" };

const semantic = (tokens as { semantic: Record<string, unknown> }).semantic;

/** Semantic roles under a category, with their resolved values. */
export function rolesIn(category: string): Array<[string, string]> {
  return Object.entries(semantic)
    .filter(([path]) => path.startsWith(`${category}.`))
    .filter((entry): entry is [string, string] => typeof entry[1] === "string")
    .map(([path, value]): [string, string] => [path.slice(category.length + 1), value])
    .sort(([a], [b]) => a.localeCompare(b));
}

/**
 * One semantic role's resolved value, as a CSS-ready string.
 *
 * Numbers are stringified: `scale.reduced` is the number 1, and a scale in CSS
 * is unitless. Throws rather than returning undefined, so a renamed token fails
 * loudly instead of producing an empty custom property.
 */
export function roleValue(path: string): string {
  const value = semantic[path];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  throw new Error(`No scalar value for ${path}`);
}

/** `font.size.body` -> `--spartant-font-size-body` */
export function cssVar(path: string): string {
  return `--spartant-${path.split(".").join("-")}`;
}
