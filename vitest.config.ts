import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Matches the alias in apps/color-tool, so its tests resolve the same
      // build-time colour maths the app does.
      "@spartant-color": resolve(import.meta.dirname, "packages/spartant/tooling/color"),
    },
  },
  test: {
    // Tests live beside the source they cover, in every workspace.
    include: [
      "{packages,apps,examples}/*/src/**/*.test.{ts,tsx}",
      "packages/*/tooling/**/*.test.{ts,tsx}",
    ],
    // The Storybook workspace has its own lane. Its tests render stories, so
    // they need a DOM and, more importantly, a built package: stories resolve
    // the package through its published exports. Running them here would put a
    // build in front of every unit test. See apps/storybook/vitest.config.ts
    // and the `test:stories` script.
    exclude: ["**/node_modules/**", "**/dist/**", "apps/storybook/**"],
    // Node is enough for the current logic tests. Component rendering tests
    // need a DOM environment, which arrives with the testing setup in HAUX-40.
    environment: "node",
    // Keeps the command stable while workspaces are still being filled in.
    passWithNoTests: true,
  },
});
