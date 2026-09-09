/**
 * Every story, run and audited.
 *
 * Two questions per story, because they fail for different reasons and a
 * reviewer needs to know which happened:
 *
 * 1. Does it render, and does its interaction contract hold? A `play` function
 *    that throws fails here, naming the story and the step.
 * 2. Does it pass axe? Violations are reported with the rule, the element, and
 *    what to change.
 *
 * Discovery is from disk, so a new component's stories join the suite by
 * existing. Nobody has to remember to register them, which is the failure this
 * is shaped to avoid: a component whose stories look thorough and are never run.
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  createCanvas,
  describeViolations,
  findViolations,
  type LoadedStory,
  loadStories,
} from "../lib/story-tests.js";

const stories: LoadedStory[] = await loadStories();

afterEach(() => {
  // Each story gets a clean document. Otherwise axe would audit the leftovers
  // of every story that ran before it, and a violation would be attributed to
  // whichever story happened to run when it was noticed.
  document.body.replaceChildren();
});

describe("stories", () => {
  it("finds stories to run", () => {
    // An empty list would make every assertion below vacuously true, which is
    // the one way a green suite means nothing at all.
    expect(stories.length).toBeGreaterThan(0);
  });

  describe.each(stories.map((story) => [story.label, story] as const))("%s", (_label, loaded) => {
    it("renders and completes its interactions", async () => {
      const canvas = createCanvas();
      // `run` renders the story and then awaits its play function, so an
      // interaction that throws surfaces here rather than being swallowed.
      await loaded.story.run({ canvasElement: canvas });
      expect(canvas.children.length).toBeGreaterThan(0);
    });

    it("has no accessibility violations", async () => {
      if (loaded.a11y.disable) {
        // A skip has to argue for itself. A bare `disable: true` is how a rule
        // gets switched off in a hurry and stays off for a year.
        expect(loaded.a11y.reason ?? "").not.toBe("");
        return;
      }

      const canvas = createCanvas();

      try {
        await loaded.story.run({ canvasElement: canvas });
      } catch {
        // The interaction test above owns this failure and prints the real
        // error. Repeating the stack here would double the failure count for
        // one cause without adding anything, so this points at it instead.
        expect.fail(`not audited: interactions failed for ${loaded.label}`);
      }

      const violations = await findViolations(canvas, loaded.a11y);
      expect(violations.length === 0 ? "" : describeViolations(loaded.label, violations)).toBe("");
    });
  });
});
