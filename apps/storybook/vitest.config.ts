import { defineConfig } from "vitest/config";

/**
 * The story lane.
 *
 * Separate from the root configuration for two reasons. Stories need a DOM,
 * and the root suite is deliberately Node-only so the logic tests stay fast.
 * More importantly, stories import the package through its published exports,
 * so this lane cannot run until `pnpm build:package` has produced `dist`. The
 * `test:stories` script builds first; keeping the lane separate is what makes
 * that possible without putting a build in front of every unit test.
 */
export default defineConfig({
  // Vitest resolves paths from the working directory, which is the workspace
  // root when this runs through a root script. Anchoring to this file keeps
  // the globs below relative to the Storybook app wherever it is invoked from.
  root: import.meta.dirname,
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    // Stories render, so they need a document. happy-dom has no layout engine,
    // which axe reports honestly as `incomplete` rather than passing silently.
    // See STORY-TEMPLATE.md for what that does and does not cover.
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    // A story file that renders nothing is a mistake, not an empty suite.
    passWithNoTests: false,
  },
});
