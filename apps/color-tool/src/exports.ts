/**
 * Turns a generated ramp into the three shapes the token pipeline accepts.
 *
 * The JSON form is the one that matters: it is pasted into a token file, so it
 * must match the schema exactly. CSS and TypeScript are conveniences for
 * pasting into a prototype before a scale is committed.
 */

import type { ScaleEntry } from "@spartant-color/scale.js";

export type ExportFormat = "json" | "css" | "typescript";

/** DTCG token JSON, shaped to drop straight into `primitive/color.tokens.json`. */
export function toTokenJson(family: string, scale: ScaleEntry[]): string {
  const steps = Object.fromEntries(
    scale.map((entry) => [String(entry.step), { $value: entry.css }]),
  );
  return `${JSON.stringify({ color: { $type: "color", [family]: steps } }, null, 2)}\n`;
}

/** CSS custom properties, using the primitive naming grammar. */
export function toCss(family: string, scale: ScaleEntry[]): string {
  const lines = scale.map((entry) => `  --spartant-color-${family}-${entry.step}: ${entry.css};`);
  return `:root {\n${lines.join("\n")}\n}\n`;
}

/** A typed const map, for a prototype that needs the values in TypeScript. */
export function toTypeScript(family: string, scale: ScaleEntry[]): string {
  const lines = scale.map((entry) => `  ${entry.step}: ${JSON.stringify(entry.css)},`);
  return `export const ${family} = {\n${lines.join("\n")}\n} as const;\n`;
}

export function toExport(format: ExportFormat, family: string, scale: ScaleEntry[]): string {
  if (format === "json") return toTokenJson(family, scale);
  if (format === "css") return toCss(family, scale);
  return toTypeScript(family, scale);
}
