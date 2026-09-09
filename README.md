# Spartant

A personal, code-first React design system for building consistent product
prototypes without giving up ownership of component source, theming,
accessibility, or documentation quality.

Status: early foundation. The workspace architecture is in place. Components,
tokens, Tailwind, Storybook, and Fumadocs arrive through their own issues.

## Requirements

- Node.js 20.11 or newer
- pnpm, pinned by the root `packageManager` field

pnpm is the required package manager for this repository. Do not run npm or
yarn for workspace commands, and never commit a `package-lock.json`.

## Workspace layout

| Path                 | Name                        | Responsibility                                        | Published |
| -------------------- | --------------------------- | ----------------------------------------------------- | --------- |
| `packages/spartant`  | `@iroshandezilva/spartant`  | The component package. The only shipped artifact.      | Yes       |
| `apps/storybook`     | `spartant-storybook`        | Isolated component workbench and state review.         | No        |
| `apps/docs`          | `spartant-docs`             | Fumadocs documentation site, deployed from `main`.     | No        |
| `examples/consumer`  | `spartant-example-consumer` | Clean consumer example that imports the package.       | No        |

### Dependency direction

Dependencies point inward, toward the package. The apps and the example consume
`@iroshandezilva/spartant` through its public entry point. The package must
never depend on the Storybook app, the documentation app, or the example.

Internal workspace dependencies use the `workspace:` protocol so local changes
are picked up immediately. The release smoke test is deliberately different: it
installs the packed artifact rather than a workspace alias, so it proves the
published package works.

## Commands

Run these from the workspace root. Every workflow goes through pnpm.

### Quality gate

| Command             | What it does                                                      |
| ------------------- | ----------------------------------------------------------------- |
| `pnpm validate`     | The full gate: format check, lint, doc links, type check, tests, build, package inspection |
| `pnpm format:check` | Check formatting without writing                                   |
| `pnpm format`       | Rewrite files to the canonical format                              |
| `pnpm lint`         | Lint, including accessibility and React hook rules                 |
| `pnpm lint:fix`     | Apply safe lint fixes                                              |
| `pnpm check`        | Format check, lint, and import sorting in one pass                 |
| `pnpm check:fix`    | Apply all safe formatting, lint, and import fixes                  |
| `pnpm typecheck`    | Type check the workspace graph and the test files                  |
| `pnpm check:docs`   | Validate links in the repository's Markdown                        |
| `pnpm check:tokens` | Validate design token sources and prove CSS, JSON, and TypeScript emission |
| `pnpm check:upstream` | Report whether adopted shadcn source changed upstream. Network, never in `validate` |
| `pnpm test`         | Run tests once. Builds the package first, because app tests import it |
| `pnpm test:watch`   | Run tests in watch mode                                            |
| `pnpm test:stories` | Render every story, run its interactions, and audit it with axe    |
| `pnpm review:storybook` | Serve a built Storybook, or a downloaded CI artifact, for visual review |

### Build and package

| Command                 | What it does                                              |
| ----------------------- | --------------------------------------------------------- |
| `pnpm build`            | Build every workspace in dependency order                  |
| `pnpm build:package`    | Build the publishable package only                         |
| `pnpm build:storybook`  | Build the Storybook workspace                              |
| `pnpm build:docs`       | Build the documentation workspace                          |
| `pnpm inspect:package`  | Pack the package and fail if unexpected files would ship   |
| `pnpm smoke:package`    | Install the packed tarball in a throwaway project outside the workspace and prove it works |

### Release

| Command                | What it does                                              |
| ---------------------- | --------------------------------------------------------- |
| `pnpm release:note`    | Scaffold a release note under `.changes/` for one user-visible change |
| `pnpm release:check`   | Validate pending notes, the kind to bump mapping, migration sections, and documentation version references, then print the proposed version. `--strict --base=origin/main` also fails a package change that carries no note; that part needs Git |
| `pnpm release:plan`    | Show the changelog section and version a release would produce, writing nothing |
| `pnpm release:prepare` | Bump the version, fold the notes into `CHANGELOG.md`, rewrite every version reference, and write the release pull request body to `.artifacts/` |

The note format and the kind to version mapping are in [`.changes/README.md`](.changes/README.md).
Version rules, the public surface they apply to, and the deprecation path are in [`packages/spartant/VERSIONING.md`](packages/spartant/VERSIONING.md).

### Day to day

| Command          | What it does                              |
| ---------------- | ----------------------------------------- |
| `pnpm install`   | Install all workspace dependencies         |
| `pnpm dev`       | Rebuild the package in watch mode          |
| `pnpm dev:example` | Build the package, then serve the consumer example |
| `pnpm dev:storybook` | Serve the component workbench on port 6006 |
| `pnpm dev:foundations` | Serve the foundations specimens at real size |
| `pnpm dev:docs` | Serve the Fumadocs documentation site |
| `pnpm dev:color-tool` | Serve the OKLCH scale tool |
| `pnpm clean`     | Remove build output and local artifacts    |

`pnpm validate` is the command to run before opening a pull request.

CI runs the same checks as separate steps in `.github/workflows/validate.yml`,
installing with `pnpm install --frozen-lockfile`. **Changing the `validate`
script means changing that workflow in the same commit**, or CI and local
development quietly diverge. Branch protection is specified in
[`.github/BRANCH_PROTECTION.md`](./.github/BRANCH_PROTECTION.md).

Storybook and docs builds currently compile placeholder TypeScript projects.
They become real builds in HAUX-39 and HAUX-54, and the command names do not
change when that happens.

## Styling

Tailwind CSS v4 with CSS custom properties as the semantic boundary. No SCSS.

### Consumer setup

Two supported paths. Both are explicit; neither relies on implicit scanning.

**You do not use Tailwind.** One import, no configuration:

```ts
import "@iroshandezilva/spartant/styles.css";
```

That file is precompiled and self-contained. It carries the tokens, both
themes, and every utility Spartant's own components use.

**You already use Tailwind.** Import the theme entry point so Spartant's
semantic roles become utilities beside your own, and point Tailwind at the
package so it can see the classes the components use:

```css
@import "tailwindcss";
@import "@iroshandezilva/spartant/theme.css";
@source "../node_modules/@iroshandezilva/spartant/dist";
```

The `@source` line is required. Tailwind only generates utilities it can see
used, and it cannot see inside a dependency unless told to look. `examples/consumer`
takes this path and is the working reference.

### Semantic roles

Components consume semantic roles, never raw values. The roles follow the token
specification: surfaces, foregrounds, borders, `primary` / `secondary` /
`accent`, the status roles, focus ring, selected, and disabled. Each maps to the
usual Tailwind utilities, so `bg-primary`, `text-foreground-muted`, and
`border-border-strong` all work.

Theme switching happens through `prefers-color-scheme`, with `data-theme` on the
root element as an explicit override. Overriding any `--spartant-*` property is
the stable, documented way to retheme.

### Themes

```tsx
import { ThemeProvider, useTheme } from "@iroshandezilva/spartant";
```

Light, dark, and system, applied through `data-theme` on the root element. For
server-rendered apps, also inline `themeScript()` in `<head>` to prevent a flash
of the wrong theme. Full detail, including why this does not cause a hydration
mismatch, is in
[`packages/spartant/src/theme/README.md`](./packages/spartant/src/theme/README.md).

### Class merging

Every component composes classes through `cn` and puts the caller's `className`
last:

```tsx
import { cn } from "@iroshandezilva/spartant";

<div className={cn("bg-primary p-4", className)} />
```

`cn` is `clsx` plus `tailwind-merge`. Putting `className` last is what makes it
a real override: passing `bg-danger` to a component whose default is
`bg-primary` removes the default rather than leaving two competing classes whose
winner depends on stylesheet order.

### Variants

Variants are a plain lookup object keyed by the role, holding complete class
strings:

```tsx
const toneClasses: Record<Tone, string> = {
  primary: "bg-primary text-primary-foreground",
  danger: "bg-danger text-danger-foreground",
};
```

Readable, no dependency, easy for an agent to extend. If variants later need
compound conditions or defaults, HAUX-44 decides whether to adopt a helper such
as `class-variance-authority` as part of the shared API conventions.

## Tooling

| Concern                  | Tool                                             |
| ------------------------ | ------------------------------------------------ |
| Formatting and linting   | Biome, one tool for both, configured in `biome.json` |
| Type checking            | TypeScript project references                     |
| Tests                    | Vitest, configured in `vitest.config.ts`          |
| Package manager          | pnpm, pinned by `packageManager`                  |

Tool versions are pinned in the `catalog` in `pnpm-workspace.yaml`. A root
`preinstall` guard fails the install if npm or yarn is used instead of pnpm.

## Shared configuration

- `tsconfig.base.json` holds the compiler options every workspace extends.
- `tsconfig.json` at the root is a solution file that references each workspace,
  so `pnpm typecheck` covers the whole graph and respects build order.
- Shared dependency versions live in the `catalog` in `pnpm-workspace.yaml`.
  Workspaces reference them with `catalog:` so versions cannot drift.

## Contributing

Read [`AGENTS.md`](./AGENTS.md) first. It is the authoritative guide for
conventions, boundaries, verification, the Linear workflow, and the definition
of done. [`.github/CONTRIBUTING.md`](./.github/CONTRIBUTING.md) is the short
orientation, and pull requests use
[the template](./.github/PULL_REQUEST_TEMPLATE.md).

Requirements come from Linear, not from this repository. Every change traces to
an issue.
