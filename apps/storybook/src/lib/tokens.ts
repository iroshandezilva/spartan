/**
 * The published token surface, read from the package's own JSON artefact.
 *
 * Stories read tokens rather than restating them, so the workbench cannot show
 * a value the package does not ship, and a token change reaches the stories
 * without anyone editing them.
 */

import tokens from "@iroshandezilva/spartant/tokens.json" with { type: "json" };

const semantic = (tokens as { semantic: Record<string, unknown> }).semantic;

/**
 * Semantic roles under a category, with their resolved values, sorted by role.
 *
 * Numbers are stringified: a scale token is the number `0.97`, and a scale in
 * CSS is unitless. Dropping non-scalars rather than stringifying them keeps
 * composite tokens such as springs, which are typed objects, out of anything
 * that expects a CSS value.
 */
export function rolesIn(category: string): Array<[string, string]> {
  return Object.entries(semantic)
    .filter(([path]) => path.startsWith(`${category}.`))
    .filter(
      (entry): entry is [string, string | number] =>
        typeof entry[1] === "string" || typeof entry[1] === "number",
    )
    .map(([path, value]): [string, string] => [path.slice(category.length + 1), String(value)])
    .sort(([a], [b]) => a.localeCompare(b));
}

/**
 * One semantic role's value as a CSS-ready string.
 *
 * Throws rather than returning `undefined`, so a renamed token fails loudly
 * instead of quietly producing an empty custom property.
 */
export function roleValue(path: string): string {
  const value = semantic[path];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  throw new Error(`No scalar value for semantic token ${path}`);
}

/** `font.size.body` -> `--spartant-font-size-body` */
export function cssVar(path: string): string {
  return `--spartant-${path.split(".").join("-")}`;
}
