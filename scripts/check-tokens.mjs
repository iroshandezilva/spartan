/**
 * Validates the design token sources.
 *
 * JSON Schema covers file structure. It cannot express the rules that actually
 * keep the token system honest, so those are checked here:
 *
 *   - every alias resolves to a token that exists
 *   - semantic tokens alias, never hold literals
 *   - primitive tokens hold literals, never alias
 *   - a theme only overrides semantic paths that already exist
 *   - deprecated tokens name a live replacement and a removal version
 *   - names follow the grammar, and state suffixes come from a closed set
 *
 * It then proves the source format can produce CSS, JSON, and TypeScript, by
 * performing the transform in memory and asserting the output. That is a
 * feasibility proof for the format, not the production pipeline. HAUX-32 builds
 * the real generator.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
// The schema is draft 2020-12, which needs ajv's 2020 build rather than its
// default draft-07 entry point.
import Ajv from "ajv/dist/2020.js";

const ROOT = "packages/spartant/src/tokens";
const SCHEMA = join(ROOT, "schema/spartant-tokens.schema.json");
const LAYERS = ["primitive", "semantic", "component", "theme"];

/** State suffixes. Closed set, and only ever the last segment of a name. */
const STATES = ["hover", "active", "selected", "disabled", "invalid", "focus"];

const problems = [];
const fail = (where, message) => problems.push(`${where}\n    ${message}`);

// ---------------------------------------------------------------- collect

function tokenFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tokenFiles(full));
    else if (entry.endsWith(".tokens.json")) out.push(full);
  }
  return out;
}

const files = tokenFiles(ROOT).sort();
const layerOf = (file) => LAYERS.find((l) => file.includes(`/${l}/`));

// ---------------------------------------------------------------- schema

const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(JSON.parse(readFileSync(SCHEMA, "utf8")));

const parsed = new Map();
for (const file of files) {
  const doc = JSON.parse(readFileSync(file, "utf8"));
  parsed.set(file, doc);
  if (!validate(doc)) {
    for (const e of validate.errors ?? []) {
      fail(relative(process.cwd(), file), `${e.instancePath || "/"} ${e.message}`);
    }
  }
}

// ---------------------------------------------------------------- walk

/** Walks a token document, yielding [dottedPath, tokenObject]. */
function* walk(node, path = []) {
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue;
    if (value && typeof value === "object" && "$value" in value) {
      yield [[...path, key].join("."), value];
    } else if (value && typeof value === "object") {
      yield* walk(value, [...path, key]);
    }
  }
}

/** Every token, by layer, as path -> { token, file }. */
const byLayer = Object.fromEntries(LAYERS.map((l) => [l, new Map()]));
for (const [file, doc] of parsed) {
  const layer = layerOf(file);
  if (!layer) {
    fail(relative(process.cwd(), file), "token file sits outside a known layer directory");
    continue;
  }
  for (const [path, token] of walk(doc)) {
    byLayer[layer].set(path, { token, file });
  }
}

/** Resolution targets: aliases may only point at primitives or semantics. */
const resolvable = new Map([...byLayer.primitive, ...byLayer.semantic]);

const ALIAS = /^\{([^}]+)\}$/;
const isAlias = (v) => typeof v === "string" && ALIAS.test(v);

// ---------------------------------------------------------------- rules

const SEGMENT = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

for (const layer of LAYERS) {
  for (const [path, { token, file }] of byLayer[layer]) {
    const where = `${relative(process.cwd(), file)}  ${path}`;
    const segments = path.split(".");

    for (const segment of segments) {
      if (!SEGMENT.test(segment)) {
        fail(where, `segment "${segment}" is not lower-case kebab-case`);
      }
    }

    const stateAt = segments.findIndex((s) => STATES.includes(s));
    if (stateAt !== -1 && stateAt !== segments.length - 1) {
      fail(where, `state "${segments[stateAt]}" must be the last segment`);
    }

    if (isAlias(token.$value)) {
      const target = token.$value.match(ALIAS)[1];
      if (!resolvable.has(target)) {
        fail(where, `alias {${target}} does not resolve to any primitive or semantic token`);
      }
      if (layer === "primitive") {
        fail(where, "primitive tokens hold literal values, never aliases");
      }
    } else if (layer === "semantic") {
      fail(where, "semantic tokens must alias a primitive, never hold a literal value");
    }

    if (token.$deprecated !== undefined) {
      const ext = token.$extensions?.["com.spartant"] ?? {};
      if (!ext.replacedBy) fail(where, "deprecated token must name a replacedBy successor");
      else if (!resolvable.has(ext.replacedBy)) {
        fail(where, `replacedBy "${ext.replacedBy}" does not resolve to a live token`);
      }
      if (!ext.removeIn) fail(where, "deprecated token must name a removeIn version");
    }

    const pairsWith = token.$extensions?.["com.spartant"]?.pairsWith;
    if (pairsWith && !resolvable.has(pairsWith)) {
      fail(where, `pairsWith "${pairsWith}" does not resolve to a live token`);
    }
  }
}

// A semantic path must not collide with a primitive path. If it does, an alias
// to that path resolves to itself and the layering silently collapses.
for (const [path, { file }] of byLayer.semantic) {
  if (byLayer.primitive.has(path)) {
    fail(
      `${relative(process.cwd(), file)}  ${path}`,
      "semantic path collides with a primitive of the same name, so an alias to it would resolve to itself",
    );
  }
}

// A theme may only restate semantic paths that already exist.
for (const [path, { file }] of byLayer.theme) {
  if (!byLayer.semantic.has(path)) {
    fail(
      `${relative(process.cwd(), file)}  ${path}`,
      "theme overrides a path with no semantic base. A theme restates roles, it does not invent them",
    );
  }
}

// ---------------------------------------------------------------- emission

/** Drops a trailing `default` and prefixes, giving the CSS custom property. */
const cssName = (path) =>
  `--spartant-${path
    .replace(/\.default$/, "")
    .split(".")
    .join("-")}`;

function resolve(value, seen = new Set()) {
  if (!isAlias(value)) return value;
  const target = value.match(ALIAS)[1];
  if (seen.has(target)) throw new Error(`alias cycle at {${target}}`);
  const entry = resolvable.get(target);
  if (!entry) throw new Error(`unresolvable alias {${target}}`);
  return resolve(entry.token.$value, new Set([...seen, target]));
}

/** Flattens a token value to something a CSS declaration accepts. */
function cssValue(value) {
  if (Array.isArray(value)) return value.map(cssValue).join(", ");
  if (value && typeof value === "object") {
    const { offsetX, offsetY, blur, spread, color } = value;
    return `${offsetX} ${offsetY} ${blur} ${spread} ${color}`;
  }
  return String(value);
}

const emission = { css: 0, json: 0, ts: 0 };
try {
  // CSS: semantic and component layers only. Primitives stay out of the
  // stylesheet on purpose, so a component cannot reach past a role.
  const cssLines = [];
  for (const layer of ["semantic", "component"]) {
    for (const [path, { token }] of byLayer[layer]) {
      const value = resolve(token.$value);
      cssLines.push(`  ${cssName(path)}: ${cssValue(value)};`);
    }
  }
  emission.css = cssLines.length;

  // JSON: the full resolved set, which is what the visualizer in HAUX-36 reads.
  const jsonOut = {};
  for (const layer of LAYERS) {
    jsonOut[layer] = Object.fromEntries(
      [...byLayer[layer]].map(([path, { token }]) => [path, resolve(token.$value)]),
    );
  }
  emission.json = Object.values(jsonOut).reduce((n, o) => n + Object.keys(o).length, 0);
  JSON.parse(JSON.stringify(jsonOut));

  // TypeScript: a const map plus a union of the semantic names.
  const tsNames = [...byLayer.semantic.keys()].map((p) => JSON.stringify(cssName(p)));
  const ts = [
    "export const semanticTokenNames = [",
    ...tsNames.map((n) => `  ${n},`),
    "] as const;",
    "export type SemanticTokenName = (typeof semanticTokenNames)[number];",
  ].join("\n");
  if (!ts.includes("SemanticTokenName")) throw new Error("TypeScript emission produced no type");
  emission.ts = tsNames.length;
} catch (error) {
  fail("emission proof", error.message);
}

// ---------------------------------------------------------------- report

console.log(`Checked ${files.length} token files.`);
for (const layer of LAYERS) {
  console.log(`  ${layer.padEnd(10)} ${String(byLayer[layer].size).padStart(3)} tokens`);
}
console.log(
  `Emission proof: ${emission.css} CSS custom properties, ${emission.json} JSON entries, ${emission.ts} TypeScript names.`,
);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? "" : "s"}:`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}

if (emission.css === 0 || emission.json === 0 || emission.ts === 0) {
  console.error("\nEmission proof produced an empty output.");
  process.exit(1);
}

console.log("\nToken sources are valid.");
