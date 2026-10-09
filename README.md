# Spartant Lab

Code-owned design-system experiment using Lit, Storybook, and a custom Figma token plugin.

Project documentation and tasks live in Linear:

- [Documentation home](https://linear.app/wearehaux/document/lit-project-home-5730425b4e0d)
- [Project issues](https://linear.app/wearehaux/project/spartant-design-system-b4328c010ac8/overview), filtered by the `Lit experiment` label

Each component has one Linear issue with separate `Dev: ...` and `Figma: ...` labels. Both must be Done for overall completion. Other work uses normal Linear issue status.

## Local commands

```sh
pnpm install
pnpm dev
```

Local `/docs` routes redirect to the matching Linear documents. The old task API returns 410 with the Linear project URL. MDX content and `data/tasks.json` remain as migration snapshots and should not be updated as live documentation or task state.

- `pnpm storybook`: Lit Storybook playground on http://127.0.0.1:6006
- `pnpm storybook:build`: static Storybook build
- `pnpm components:build`: build `packages/components` (`@spartant-lab/components`)
- `pnpm tokens:build`: Figma export to `tokens/source.json` to `public/tokens.css`; `pnpm tokens:check` fails when they are stale
- `pnpm test:e2e`: builds Storybook and runs real-keyboard Chromium tests
- `pnpm test`: builds the component package, then runs token, plugin, package-consumer, and historical local tracker checks
- `pnpm build`: token output, plugin bundle, and redirect application
- `pnpm typecheck`: TypeScript checks
- `pnpm plugin:build`: rebuild the Figma development plugin

Import `plugin/manifest.json` into Figma. Read the [Linear plugin guide](https://linear.app/wearehaux/document/lit-custom-figma-plugin-634833fa2f31) before use. Production tokens come from a verified export of the Spartan DS variables (`tokens/figma/README.md`); the plugin and its tests still use the isolated fixture in `tokens/fixtures/lab.json`. Real Figma runtime validation of the plugin is still pending. The first Lit components (`sp-button` and `sp-icon-button`) and Storybook live in `packages/components`; Figma parity is tracked in their Linear issues.

This directory preserves the previous workspace's pending deletions and does not restore the earlier React implementation.

## Icons in Storybook

Buttons take icons in the `start` (left) and `end` (right) slots, and any `<svg>` works. Storybook offers the licensed [Central Icons](https://iconists.co/central) set (round, outlined, radius 2, stroke 1.5, the Figma icon spec) through an **Icons** panel: search by name or keyword, then pick a left and a right icon.

- The icon package is a story-only optional dependency. Install with your license key in the environment: `CENTRAL_LICENSE_KEY=... pnpm install`. Never commit the key.
- `pnpm storybook` and `pnpm storybook:build` run `icons:generate`, which writes git-ignored `packages/components/.storybook/generated/icons.json`. Nothing from the icon set is in `src`, `dist`, or git, and the license forbids redistributing it.
- Without the package installed, stories fall back to a plain plus icon and the panel explains how to enable the library.
