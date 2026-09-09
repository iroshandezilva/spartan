/**
 * The reduced-motion story simulates the package's real collapse. This asserts
 * the simulation and the stylesheet write the same properties, with the same
 * effect.
 *
 * Without this, the two drift silently in the direction that matters least and
 * hurts most: someone adds a motion token, adds it to the stylesheet's
 * reduced-motion rule, and the workbench keeps animating it inside a story
 * explicitly labelled "reduced motion". A reviewer would sign off on motion
 * they had been told was removed.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { reducedMotionOverrides } from "./reduced-motion.js";
import { roleValue } from "./tokens.js";

const THEME_CSS = resolve(
  import.meta.dirname,
  "../../../../packages/spartant/src/styles/theme.css",
);

/**
 * The declarations inside the stylesheet's `prefers-reduced-motion` rule.
 *
 * Deliberately a small hand-rolled reader rather than a CSS parser dependency:
 * it only has to understand one flat block, and it throws unless it finds
 * exactly one, so a restructured stylesheet fails here instead of quietly
 * matching nothing and passing.
 */
function stylesheetReducedMotionBlock(): Map<string, string> {
  const css = readFileSync(THEME_CSS, "utf8");

  const matches = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{/g)];
  if (matches.length !== 1) {
    throw new Error(`Expected one reduced-motion rule in theme.css, found ${matches.length}`);
  }

  const start = css.indexOf("{", matches[0]?.index ?? 0);

  // Walk braces so the reader stops at the media query's own closing brace
  // rather than the first one it meets, which belongs to the `:root` inside it.
  let depth = 0;
  let end = css.length;
  for (let i = start; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const declarations = new Map<string, string>();
  for (const [, property, value] of css.slice(start, end).matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
    if (property && value) declarations.set(property, value.trim());
  }
  return declarations;
}

/**
 * The value a declaration resolves to.
 *
 * The stylesheet indirects through a token (`var(--spartant-scale-reduced)`)
 * where the simulation writes the literal that token holds, so comparing them
 * means resolving the indirection through the same published token surface the
 * simulation reads.
 */
function resolved(value: string): string {
  const indirect = /^var\((--spartant-[\w-]+)\)$/.exec(value);
  if (!indirect?.[1]) return value;

  const segments = indirect[1].replace("--spartant-", "").split("-");
  const role = segments.pop();
  return roleValue(`${segments.join("-")}.${role}`);
}

describe("reduced motion simulation", () => {
  const stylesheet = stylesheetReducedMotionBlock();
  const simulated = reducedMotionOverrides();

  it("reads a non-empty rule out of the stylesheet", () => {
    // Guards the assertions below. An empty map would make the set comparison
    // pass against an equally empty simulation.
    expect(stylesheet.size).toBeGreaterThan(0);
  });

  it("overrides exactly the properties the stylesheet overrides", () => {
    expect(Object.keys(simulated).sort()).toEqual([...stylesheet.keys()].sort());
  });

  it("collapses each property to the value the stylesheet collapses it to", () => {
    for (const [property, value] of stylesheet) {
      expect([property, simulated[property]]).toEqual([property, resolved(value)]);
    }
  });
});
