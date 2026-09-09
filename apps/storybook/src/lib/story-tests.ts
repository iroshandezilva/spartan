/**
 * Shared machinery for running stories as tests.
 *
 * Stories are the test cases. Writing a second set of fixtures beside them
 * would mean the states a reviewer looks at and the states the suite checks
 * could drift apart, and the drift would be invisible until something shipped
 * broken. Portable stories remove that gap: the suite runs the same story
 * objects the workbench renders, through the same preview annotations, so the
 * decorators, theme, and parameters are the real ones.
 */

import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { composeStories } from "@storybook/react";
import axe, { type Result } from "axe-core";
import { type A11yParameters, AXE_CONFIG } from "./a11y.js";

/** Where story files live. One directory, by convention and by the template. */
const STORIES_DIR = resolve(import.meta.dirname, "../stories");

/** The suffix every story file carries, and the extension the bundler needs. */
const STORY_SUFFIX = ".stories.tsx";

/**
 * The part of a composed story this suite uses.
 *
 * Storybook's own `ComposedStoryFn` lives behind an internal entry point, and
 * reaching into one to save three lines is how a minor version bump breaks the
 * test suite. This is a structural type over exactly what is called here.
 */
interface RunnableStory {
  storyName?: string;
  parameters: Record<string, unknown>;
  /** Renders the story, then awaits its play function. */
  run: (context?: { canvasElement: HTMLElement }) => Promise<void>;
}

/** One story, with the file and parameters needed to report on it. */
export interface LoadedStory {
  /** Story file name, so a failure names something openable. */
  file: string;
  /** The exported identifier, which is what the story template requires. */
  exportName: string;
  /** `Foundations/Style proof › Default`, matching the workbench sidebar. */
  label: string;
  story: RunnableStory;
  a11y: A11yParameters;
}

/** Module-level exports that are not stories. */
const NOT_STORIES = new Set(["default", "__namedExportsOrder"]);

/**
 * Every story in every story file in a directory.
 *
 * Discovered from disk rather than listed, for the same reason the contract
 * test discovers them: a list is the thing someone forgets to update, and the
 * failure is silent. A new component's stories are covered the moment the file
 * exists.
 */
export async function loadStories(): Promise<LoadedStory[]> {
  const names = readdirSync(STORIES_DIR)
    .filter((file) => file.endsWith(STORY_SUFFIX))
    .map((file) => file.slice(0, -STORY_SUFFIX.length))
    .sort();

  const loaded: LoadedStory[] = [];

  for (const name of names) {
    const file = `${name}${STORY_SUFFIX}`;
    // The extension stays in the static part of the specifier so the bundler
    // can still see which files this could resolve to. Interpolating the whole
    // filename makes that unanalysable and only works by accident.
    const module = (await import(`../stories/${name}.stories.tsx`)) as Record<string, unknown>;
    const meta = module["default"] as { title?: string } | undefined;
    const composed = composeStories(module as Parameters<typeof composeStories>[0]);

    for (const [exportName, story] of Object.entries(composed)) {
      if (NOT_STORIES.has(exportName)) continue;
      const typed = story as unknown as RunnableStory;
      loaded.push({
        file,
        exportName,
        label: `${meta?.title ?? file} › ${typed.storyName ?? exportName}`,
        story: typed,
        a11y: (typed.parameters["a11y"] as A11yParameters | undefined) ?? {},
      });
    }
  }

  return loaded;
}

/** A canvas attached to the document, which axe needs to evaluate visibility. */
export function createCanvas(): HTMLElement {
  const canvas = document.createElement("div");
  document.body.append(canvas);
  return canvas;
}

/**
 * Accessibility violations in a rendered story.
 *
 * Per-story options are merged over the shared configuration rather than
 * replacing it, so a story that needs one rule relaxed cannot accidentally
 * switch off every other rule at the same time.
 */
export async function findViolations(canvas: HTMLElement, a11y: A11yParameters): Promise<Result[]> {
  const results = await axe.run(canvas, {
    ...AXE_CONFIG,
    ...a11y.options,
    rules: { ...AXE_CONFIG.rules, ...a11y.options?.rules },
  });
  return results.violations;
}

/**
 * A failure message a person can act on without opening axe's documentation
 * first: which story, which rule, how bad, which element, and what to change.
 *
 * The default axe object serialises to something unreadable in a test runner,
 * and an unreadable failure gets skipped rather than fixed.
 */
export function describeViolations(label: string, violations: Result[]): string {
  const lines = [`${label} has ${violations.length} accessibility violation(s):`];

  for (const violation of violations) {
    lines.push("", `  ${violation.id} (${violation.impact ?? "unknown impact"}) ${violation.help}`);
    lines.push(`  ${violation.helpUrl}`);
    for (const node of violation.nodes) {
      lines.push(`    at ${node.target.join(" ")}`);
      lines.push(`      ${node.html}`);
      const summary = node.failureSummary?.split("\n").join("\n      ");
      if (summary) lines.push(`      ${summary}`);
    }
  }

  return lines.join("\n");
}
