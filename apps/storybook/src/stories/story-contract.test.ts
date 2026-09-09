/**
 * The story template, enforced.
 *
 * `STORY-TEMPLATE.md` describes what a component story file must contain, and
 * the types in `../lib/contract.ts` make the contract itself impossible to
 * leave out. Neither can check the part that actually decays: whether the
 * stories the contract implies were written.
 *
 * A component with a declared press animation and no `ReducedMotion` story
 * compiles perfectly. A component that declares five variants and shows one
 * compiles perfectly. Those are the failures this catches, and it names the
 * file and the missing export rather than reporting that something is wrong.
 *
 * It reads story files the way Storybook does, as modules, so it sees the same
 * exports Storybook will index. Rendering is not involved: this asserts the
 * shape of the matrix, and HAUX-40 asserts the behaviour inside it.
 */

import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { requiredStories, type StoryContract } from "../lib/contract.js";

/** Named exports that are not stories. */
const NOT_STORIES = new Set(["default", "__namedExportsOrder"]);

/**
 * Every story file in this directory, discovered rather than listed.
 *
 * A list would be the one place someone forgets to update, and the failure
 * mode is silent: a new component's stories would simply never be checked.
 */
const SUFFIX = ".stories.tsx";

const storyNames = readdirSync(import.meta.dirname)
  .filter((file) => file.endsWith(SUFFIX))
  .map((file) => file.slice(0, -SUFFIX.length))
  .sort();

const modules: Array<[string, Record<string, unknown>]> = await Promise.all(
  storyNames.map(
    async (name): Promise<[string, Record<string, unknown>]> => [
      `${name}${SUFFIX}`,
      // The extension stays in the static part of the specifier so the bundler
      // can see which files this could resolve to.
      (await import(`./${name}.stories.tsx`)) as Record<string, unknown>,
    ],
  ),
);

/**
 * Story files that document a component, as opposed to the foundations
 * specimens, which have no `component` and no states to matrix.
 */
const componentStoryFiles = modules.filter(([, module]) => {
  const meta = module.default as { component?: unknown } | undefined;
  return meta?.component !== undefined;
});

describe("component story files", () => {
  it("finds component story files to check", () => {
    // Without this, deleting every story file or breaking discovery would leave the
    // suite below iterating an empty list and reporting success.
    expect(componentStoryFiles.length).toBeGreaterThan(0);
  });

  describe.each(componentStoryFiles)("%s", (_path, module) => {
    const meta = module.default as {
      title?: string;
      parameters?: { spartant?: StoryContract };
    };
    const contract = meta.parameters?.spartant;

    it("declares a story contract", () => {
      expect(contract).toBeDefined();
    });

    it("exports every story its contract requires", () => {
      if (!contract) return;
      const exported = Object.keys(module).filter((name) => !NOT_STORIES.has(name));
      const missing = requiredStories(contract).filter((name) => !exported.includes(name));
      expect(missing).toEqual([]);
    });

    it("pins its dark-theme story to dark rather than trusting the toolbar", () => {
      // The toolbar is a global. A `DarkTheme` story that does not override it
      // renders in whatever theme the reviewer last selected, which means it
      // can pass review while showing light.
      const dark = module.DarkTheme as
        | { parameters?: { themes?: { themeOverride?: string } } }
        | undefined;
      expect(dark?.parameters?.themes?.themeOverride).toBe("dark");
    });

    it("gives interactive components a play function on each input path", () => {
      if (!contract?.interactive) return;
      for (const name of ["KeyboardPath", "PointerPath"]) {
        const story = module[name] as { play?: unknown } | undefined;
        expect(`${name}.play: ${typeof story?.play}`).toBe(`${name}.play: function`);
      }
    });

    it("names semantic motion roles, never primitive steps", () => {
      if (contract?.motion.kind !== "motion") return;
      // A component that names a primitive has reached past the semantic layer,
      // which means retuning the role would not reach it.
      const primitives = contract.motion.tokens.filter((token) =>
        /^(motion|duration)\.\d/.test(token),
      );
      expect(primitives).toEqual([]);
    });

    it("records a motion decision either way", () => {
      if (!contract) return;
      const decision =
        contract.motion.kind === "motion" ? contract.motion.purpose : contract.motion.rationale;
      expect(decision.length).toBeGreaterThan(0);
    });
  });
});
