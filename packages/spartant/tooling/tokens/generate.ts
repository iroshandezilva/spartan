/**
 * The token pipeline. One source, three outputs, plus the primitives.
 *
 *   seeds  ->  primitive/color.tokens.json   (generated ramps)
 *   tokens ->  src/styles/tokens.css         (CSS custom properties, both themes)
 *          ->  src/tokens/generated/tokens.json
 *          ->  src/tokens/generated/tokens.ts
 *
 * Run with `--check` to compare the committed files against a fresh generation
 * without writing. That is the drift gate: if the source moved and the outputs
 * did not, the build fails rather than shipping a stale stylesheet.
 *
 * Build-time only. Nothing here reaches the published package.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { formatOklch } from "../color/oklch.js";
import { generateScale } from "../color/scale.js";
import { EXAMPLE_SEEDS } from "../color/seeds.js";

const PACKAGE = "packages/spartant";
const TOKENS = `${PACKAGE}/src/tokens`;
const LAYERS = ["primitive", "semantic", "component", "theme"] as const;

/** Written by hand, never generated. Everything else in `generated/` is output. */
const PRIMITIVE_COLOR = `${TOKENS}/primitive/color.tokens.json`;

type TokenValue = string | number | Record<string, string>;
interface Token {
  $value: TokenValue;
  $type?: string;
  $description?: string;
  $deprecated?: string;
  $extensions?: Record<string, Record<string, string>>;
}

const HEADER = (source: string) =>
  `/*\n * GENERATED FILE. Do not edit.\n *\n * Produced from ${source} by\n * packages/spartant/tooling/tokens/generate.ts. Run \`pnpm tokens:build\`.\n * \`pnpm tokens:check\` fails when this file drifts from the source.\n */\n`;

// ------------------------------------------------------------ primitives

/** Builds the colour ramps from the seeds, so palettes are never hand-typed. */
function buildPrimitiveColors(): string {
  const color: Record<string, Record<string, Token>> = {};
  for (const seed of EXAMPLE_SEEDS) {
    const family: Record<string, Token> = {};
    for (const entry of generateScale(seed)) {
      family[String(entry.step)] = { $value: formatOklch(entry.color) };
    }
    color[seed.name] = family;
  }
  return `${JSON.stringify(
    {
      $schema: "../schema/spartant-tokens.schema.json",
      $description:
        "GENERATED. Colour ramps produced from the seeds in tooling/color/seeds.ts by the scale contract in COLOR.md. Do not edit by hand: run `pnpm tokens:build`. Seeds are examples until HAUX-33 approves the palette.",
      color: { $type: "color", ...color },
    },
    null,
    2,
  )}\n`;
}

// ------------------------------------------------------------ loading

function tokenFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tokenFiles(full));
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

type Layers = Record<(typeof LAYERS)[number], Map<string, Token>>;

function load(primitiveColorOverride: string): Layers {
  const layers = Object.fromEntries(LAYERS.map((l) => [l, new Map<string, Token>()])) as Layers;
  for (const file of tokenFiles(TOKENS).sort()) {
    const layer = LAYERS.find((l) => file.includes(`/${l}/`));
    if (!layer) continue;
    const raw = file === PRIMITIVE_COLOR ? primitiveColorOverride : readFileSync(file, "utf8");
    for (const [path, token] of walk(JSON.parse(raw))) layers[layer].set(path, token);
  }
  return layers;
}

const ALIAS = /^\{([^}]+)\}$/;

/** Resolves an alias chain to a literal, against the layers an alias may target. */
function resolve(
  value: TokenValue,
  lookup: Map<string, Token>,
  seen = new Set<string>(),
): TokenValue {
  if (typeof value !== "string") return value;
  const match = value.match(ALIAS);
  if (!match) return value;
  const target = match[1] as string;
  if (seen.has(target)) throw new Error(`Alias cycle at {${target}}`);
  const token = lookup.get(target);
  if (!token) throw new Error(`Unresolvable alias {${target}}`);
  return resolve(token.$value, lookup, new Set([...seen, target]));
}

/** `color.surface.default` -> `--spartant-color-surface`, per the taxonomy. */
function cssName(path: string): string {
  return `--spartant-${path
    .replace(/\.default$/, "")
    .split(".")
    .join("-")}`;
}

function cssValue(value: TokenValue): string {
  if (value && typeof value === "object") {
    const s = value as Record<string, string>;
    // Shadow is the only object shape CSS can express. Anything else
    // reaching here is a pipeline bug, and emitting "undefined" would
    // bury it in a stylesheet instead of failing the build.
    if (s.offsetX === undefined || s.color === undefined) {
      throw new Error(`Cannot express this value in CSS: ${JSON.stringify(value)}`);
    }
    return `${s.offsetX} ${s.offsetY} ${s.blur} ${s.spread} ${s.color}`;
  }
  return String(value);
}

// ------------------------------------------------------------ emitters

interface Outputs {
  primitiveColor: string;
  css: string;
  json: string;
  ts: string;
}

function build(): Outputs {
  const primitiveColor = buildPrimitiveColors();
  const layers = load(primitiveColor);
  const lookup = new Map([...layers.primitive, ...layers.semantic]);

  /** Emitted to CSS in a fixed order so output is stable across runs. */
  const emitted = [...layers.semantic, ...layers.component].sort(([a], [b]) => a.localeCompare(b));

  /** CSS has no spring primitive, so springs never become custom properties. */
  const isSpring = (path: string) => path.startsWith("spring.");

  const declarations = (tokens: Iterable<[string, Token]>, indent: string) =>
    [...tokens]
      .filter(([path]) => !isSpring(path))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([path, token]) => `${indent}${cssName(path)}: ${cssValue(resolve(token.$value, lookup))};`,
      )
      .join("\n");

  // A theme restates semantic roles, so dark resolves against a lookup where
  // the dark values win.
  const darkLookup = new Map([...lookup, ...layers.theme]);
  const darkDeclarations = (indent: string) =>
    [...layers.theme]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([path, token]) =>
          `${indent}${cssName(path)}: ${cssValue(resolve(token.$value, darkLookup))};`,
      )
      .join("\n");

  const css = `${HEADER("packages/spartant/src/tokens/")}
:root {
  color-scheme: light;

${declarations(emitted, "  ")}
}

/*
 * Dark theme by browser preference. The \`:not([data-theme="light"])\` guard is
 * what lets an explicit light choice win over the system setting.
 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;

${darkDeclarations("    ")}
  }
}

/* Dark theme by explicit choice, independent of the browser preference. */
:root[data-theme="dark"] {
  color-scheme: dark;

${darkDeclarations("  ")}
}
`;

  const jsonPayload: Record<string, Record<string, TokenValue>> = {};
  for (const layer of LAYERS) {
    const target = layer === "theme" ? darkLookup : lookup;
    jsonPayload[layer] = Object.fromEntries(
      [...layers[layer]]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([path, token]) => [path, resolve(token.$value, target)]),
    );
  }
  const json = `${JSON.stringify(
    { $comment: "GENERATED FILE. Do not edit. Run `pnpm tokens:build`.", ...jsonPayload },
    null,
    2,
  )}\n`;

  const semanticNames = [...layers.semantic.keys()].filter((path) => !isSpring(path)).sort();
  const springEntries = [...layers.semantic]
    .filter(([path]) => isSpring(path))
    .sort(([a], [b]) => a.localeCompare(b));
  const ts = `${HEADER("packages/spartant/src/tokens/")}
/** Every semantic token, as the CSS custom property that carries it. */
export const semanticTokens = {
${semanticNames.map((path) => `  ${JSON.stringify(path)}: ${JSON.stringify(cssName(path))},`).join("\n")}
} as const;

/** A semantic token path, for example \`color.foreground.muted\`. */
export type SemanticTokenPath = keyof typeof semanticTokens;

/** The CSS custom property a semantic token resolves to. */
export type SemanticTokenVariable = (typeof semanticTokens)[SemanticTokenPath];

/**
 * Returns the \`var()\` reference for a semantic token.
 *
 * Use this when a value has to reach inline styles or a canvas, where a utility
 * class cannot. Prefer the utility classes everywhere else.
 */
export function tokenVar(path: SemanticTokenPath): string {
  return \`var(\${semanticTokens[path]})\`;
}

/** A spring, in the shape an animation library expects. */
export interface SpringToken {
  stiffness: number;
  damping: number;
  mass: number;
}

/**
 * Spring tokens.
 *
 * Typed values rather than CSS custom properties, because CSS has no spring
 * primitive. An animation library consumes these when one is justified;
 * until then they are the agreed values, not a dependency.
 *
 * Provisional until HAUX-68 validates them against real components.
 */
export const springs = {
${springEntries.map(([path, token]) => `  ${JSON.stringify(path.slice("spring.".length))}: ${JSON.stringify(resolve(token.$value, lookup))},`).join("\n")}
} as const satisfies Record<string, SpringToken>;

/** A spring role, for example \`state\`. */
export type SpringName = keyof typeof springs;
`;

  return { primitiveColor, css, json, ts };
}

// ------------------------------------------------------------ cli

const TARGETS: Array<[keyof Outputs, string]> = [
  ["primitiveColor", PRIMITIVE_COLOR],
  ["css", `${PACKAGE}/src/styles/tokens.css`],
  ["json", `${TOKENS}/generated/tokens.json`],
  ["ts", `${TOKENS}/generated/tokens.ts`],
];

const outputs = build();
const checkOnly = process.argv.includes("--check");
const stale: string[] = [];

for (const [key, path] of TARGETS) {
  const next = outputs[key];
  if (checkOnly) {
    let current = "";
    try {
      current = readFileSync(path, "utf8");
    } catch {
      stale.push(`${relative(process.cwd(), path)} is missing`);
      continue;
    }
    if (current !== next) stale.push(`${relative(process.cwd(), path)} is out of date`);
  } else {
    writeFileSync(path, next);
    console.log(`  wrote ${relative(process.cwd(), path)}`);
  }
}

if (checkOnly) {
  if (stale.length > 0) {
    console.error("Generated token output has drifted from the source:\n");
    for (const item of stale) console.error(`  ${item}`);
    console.error("\nRun `pnpm tokens:build` and commit the result.");
    process.exit(1);
  }
  console.log("  token output matches the source");
}
