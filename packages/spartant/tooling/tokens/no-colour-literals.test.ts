/**
 * No component writes a colour literal.
 *
 * `check:colors` validates declared pairings between semantic roles. It is a
 * good gate and it has a hole exactly the size of this test: a colour written
 * as a literal is not a role, so it appears in no pairing, and the check cannot
 * see it. Nor can `theme-mapping.test.ts`, which only asks whether declared
 * roles reach Tailwind. Nor can axe under happy-dom, which has no layout and so
 * does not evaluate contrast at all.
 *
 * A switch thumb written as `radial-gradient(circle, white 49%, ...)` passed
 * every check in this repository while measuring 2.33:1 against its own track
 * in dark theme, under a 3:1 floor for an indicator that carries state. It was
 * found by a review that measured the rendered colours by hand.
 *
 * A Tailwind utility naming a semantic role is fine, because the role is a
 * token. What this catches is a colour value typed into source, which is almost
 * always inside an arbitrary value where no utility name would fit.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS = resolve(import.meta.dirname, "../../src/components");

/**
 * Colour literals, in the forms that actually appear in class strings.
 *
 * `transparent` and `currentColor` are deliberately absent: neither is a colour
 * the theme needs an opinion about. `transparent` is the absence of a fill, and
 * `currentColor` inherits from a role already chosen upstream.
 */
const LITERAL = [
  { name: "hex", pattern: /#[0-9a-fA-F]{3,8}\b/ },
  { name: "rgb()", pattern: /\brgba?\(/ },
  { name: "hsl()", pattern: /\bhsla?\(/ },
  { name: "oklch()/oklab()", pattern: /\bokla?[bch]+\(/ },
  {
    name: "a named colour",
    // Only inside an arbitrary value, which is where one can hide. A prose
    // mention of the word "white" in a comment is not a defect, and comments
    // are stripped before this runs anyway.
    // The trailing boundary is a negative lookahead, not `\b`. Tailwind writes
    // spaces as underscores, and `_` is a word character, so `\bwhite\b` does
    // not match `white_49%`. That is not a hypothetical: the first version of
    // this test used `\b` and cheerfully passed the exact defect it was written
    // to catch.
    pattern:
      /\[[^\]]*\b(white|black|red|green|blue|grey|gray|yellow|orange|purple)(?![a-zA-Z])[^\]]*\]/,
  },
] as const;

function sourceFiles(directory: string, found: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const full = `${directory}/${entry}`;
    if (statSync(full).isDirectory()) sourceFiles(full, found);
    else if (/\.tsx?$/.test(entry) && !entry.endsWith(".test.ts")) found.push(full);
  }
  return found;
}

/** Comments are prose. A file explaining why a literal was removed is not a defect. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

const files = sourceFiles(COMPONENTS).map((path) => ({
  path: path.slice(COMPONENTS.length + 1),
  source: withoutComments(readFileSync(path, "utf8")),
}));

describe("components use colour roles, never literals", () => {
  it("finds component source to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(LITERAL)("no component contains $name", ({ pattern }) => {
    const offenders = files
      .filter(({ source }) => pattern.test(source))
      .map(({ path, source }) => `${path}: ${pattern.exec(source)?.[0] ?? ""}`);
    expect(offenders).toEqual([]);
  });
});
