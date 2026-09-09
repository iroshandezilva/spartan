/**
 * Resolves the semantic layer for a named theme.
 *
 * Light is the base. A theme file restates only the roles that differ, so the
 * dark theme is the light mapping with overrides applied on top rather than a
 * second full palette to keep in step.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { type Oklch, parseOklch } from "../color/oklch.js";

const TOKENS = "packages/spartant/src/tokens";

export type ThemeName = "light" | "dark";

interface Token {
  $value: string | number | Record<string, string>;
}

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...files(full));
    else if (entry.endsWith(".tokens.json")) out.push(full);
  }
  return out;
}

function* walk(node: Record<string, unknown>, path: string[] = []): Generator<[string, Token]> {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$") || value === null || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    if ("$value" in record) yield [[...path, key].join("."), record as unknown as Token];
    else yield* walk(record, [...path, key]);
  }
}

function read(layer: string): Map<string, Token> {
  const map = new Map<string, Token>();
  for (const file of files(TOKENS).sort()) {
    if (!file.includes(`/${layer}/`)) continue;
    for (const [path, token] of walk(JSON.parse(readFileSync(file, "utf8")))) map.set(path, token);
  }
  return map;
}

const ALIAS = /^\{([^}]+)\}$/;

/**
 * Every semantic colour role in one theme, resolved to a literal colour.
 *
 * Roles that are not colours, and shadows, are skipped: contrast is only
 * meaningful between two colours.
 */
export function resolveTheme(theme: ThemeName): Map<string, Oklch> {
  const primitive = read("primitive");
  const semantic = read("semantic");
  const overrides = theme === "dark" ? read("theme") : new Map<string, Token>();

  const lookup = new Map([...primitive, ...semantic, ...overrides]);

  const resolve = (value: Token["$value"], seen = new Set<string>()): string | null => {
    if (typeof value !== "string") return null;
    const match = value.match(ALIAS);
    if (!match) return value;
    const target = match[1] as string;
    if (seen.has(target)) throw new Error(`Alias cycle at {${target}}`);
    const next = lookup.get(target);
    if (!next) throw new Error(`Unresolvable alias {${target}}`);
    return resolve(next.$value, new Set([...seen, target]));
  };

  const out = new Map<string, Oklch>();
  for (const [path, token] of new Map([...semantic, ...overrides])) {
    if (!path.startsWith("color.")) continue;
    const literal = resolve(token.$value);
    if (literal === null) continue;
    out.set(path, parseOklch(literal));
  }
  return out;
}
