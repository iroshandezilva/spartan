/**
 * A Spartant component never animates its focus ring, and never uses a broad
 * transition that would animate it by accident.
 *
 * The motion standard says focus behaviour happens independently of animation.
 * A ring that fades in, or settles from one colour to another, is a focus
 * indicator that is not yet correct at the moment focus lands, which is exactly
 * when someone needs to see it.
 *
 * This was an inconsistency rather than a rule until HAUX-68 compared the three
 * transition lists in the first component slice. Button and the selection
 * controls left the outline alone; the text-field primitives transitioned
 * `outline-color`, so a field was the one place a ring arrived in the inherited
 * text colour and spent 160ms becoming the focus colour.
 *
 * Deliberately scanned from component source rather than the compiled
 * stylesheet. Tailwind emits its own `transition` and `transition-colors`
 * utilities whether or not anything uses them, and both include `outline-color`,
 * so a build-output scan can only ever report those and never the thing that
 * matters: which utility a component chose.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS = resolve(import.meta.dirname, "../../src/components");

function sourceFiles(directory: string, found: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const full = `${directory}/${entry}`;
    if (statSync(full).isDirectory()) sourceFiles(full, found);
    else if (/\.tsx?$/.test(entry) && !entry.endsWith(".test.ts")) found.push(full);
  }
  return found;
}

/**
 * Source with comments removed.
 *
 * Necessary, not tidiness: the first version of this test matched the word
 * "transition" inside a sentence explaining why the dialog's close is not
 * gated on one, and reported `Dialog.tsx` as an offender. A gate that fails on
 * prose is the same mistake as a gate that cannot fail, and it would have been
 * "fixed" by deleting the explanation.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/\/\/[^\n]*/g, " ");
}

const files = sourceFiles(COMPONENTS).map((path) => ({
  path: path.slice(COMPONENTS.length + 1),
  source: withoutComments(readFileSync(path, "utf8")),
}));

describe("focus indicators are never animated", () => {
  it("finds component source to check", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no component names an outline property in a transition", () => {
    const offenders = files
      .filter(({ source }) => /transition-\[[^\]]*outline/.test(source))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  /**
   * `transition` and `transition-colors` both include `outline-color`, and
   * `transition-all` includes everything. The standard already forbids
   * `transition: all`; this extends that to the two utilities that would
   * animate the focus ring without anyone choosing to.
   */
  it.each(["transition-all", "transition-colors"])("no component uses %s", (utility) => {
    const offenders = files
      .filter(({ source }) => new RegExp(`(^|[\\s"'\`])${utility}([\\s"'\`]|$)`, "m").test(source))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });

  it("no component uses the bare transition utility", () => {
    // `transition` on its own is Tailwind's broad default list, which includes
    // `outline-color`. A component names the properties it animates.
    const offenders = files
      .filter(({ source }) => /(^|[\s"'`])transition([\s"'`]|$)/m.test(source))
      .map(({ path }) => path);
    expect(offenders).toEqual([]);
  });
});
