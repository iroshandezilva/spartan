# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Read AGENTS.md first

The import above loads `AGENTS.md` automatically, so its content is always in context and is deliberately not duplicated here.

`AGENTS.md` at the repository root is the authoritative agent guide for this project. It defines the source-of-truth ordering, confirmed technical direction, explicit boundaries, token layering rules, component and Storybook requirements, verification expectations, manual-test policy, definition of done, completion-report format, and stop conditions. Do not restate or re-derive those rules here. Read that file before starting work and follow it.

This file records only what `AGENTS.md` does not cover: the current state of the repository and the practical facts an agent needs on day one.

## Commands

All commands run from the workspace root and go through pnpm. Never use npm or yarn here; a `preinstall` guard fails the install if you try.

**`pnpm validate` is the full gate.** It runs format check, lint, doc-link check, token checks, colour checks, type check, tests, story interaction and accessibility tests, build, and package inspection in that order. Run it before claiming work is complete. If you change the `validate` script, update this line and the `README.md` table in the same change.

Individually:

- `pnpm format:check` / `pnpm format` - Biome formatting, check or write.
- `pnpm lint` / `pnpm lint:fix` - Biome lint, including accessibility and React hook rules.
- `pnpm check` / `pnpm check:fix` - format, lint, and import sorting in one pass.
- `pnpm typecheck` - `tsc -b` across project references, then the test files.
- `pnpm check:docs` - validates relative links in Markdown. External Linear links are shape-checked only, never fetched.
- `pnpm check:tokens` - validates design token sources against the schema, checks alias resolution, layer rules, naming grammar and deprecation, then proves CSS, JSON and TypeScript emission.

CI mirrors these as separate steps in `.github/workflows/validate.yml`. Changing the `validate` script means changing that workflow in the same commit. Branch protection settings are specified in `.github/BRANCH_PROTECTION.md` and must be applied by Iroshan; until then CI reports but does not block.
- `pnpm test` / `pnpm test:watch` - Vitest. Run a single file with `pnpm test <path>`, a single test by name with `pnpm test -t "<name>"`. This lane is Node-only and deliberately excludes `apps/storybook`. Both build the package first: several app tests import `@iroshandezilva/spartant` through its published exports, so on a fresh clone they cannot run until `dist` exists.
- `pnpm review:storybook [path]` - serves a built Storybook over HTTP for visual review, defaulting to `apps/storybook/storybook-static`. Point it at an unzipped CI artifact to review a pull request. It exists because the build loads its runtime as an ES module and fetches `index.json`, both of which browsers block over `file://`, so opening `index.html` directly gives a blank page. Dependency-free on purpose. See `apps/storybook/VISUAL-REVIEW.md`.
- `pnpm test:stories` - the story lane. Builds the package, then renders every story, awaits its play function, and audits the result with axe. Separate because stories need a DOM and resolve the package through its published exports, so they cannot run before `build:package`. Config in `apps/storybook/vitest.config.ts`.
- `pnpm build` - every workspace in dependency order. Also `build:package`, `build:storybook`, `build:docs`.
- `pnpm inspect:package` - packs the package and fails if unexpected files would ship.
- `pnpm smoke:package` - packs the package, installs the tarball in a throwaway project in the system temporary directory, and proves the entry point, subpath exports, types, and rendered markup work with no workspace alias. Fixture in `smoke/`, driver in `scripts/smoke-test.mjs`. Not part of `validate`: it installs from the registry, so it belongs to the release job. Add `--keep` to inspect the consumer project.
- `pnpm release:note` / `pnpm release:check` / `pnpm release:plan` / `pnpm release:prepare` - the release preparation workflow from HAUX-62. One Markdown note per user-visible change under `.changes/`, with a `kind` that fixes which version bumps it may claim and a required `## Migration` section for a `major`. `release:check` validates the notes and the `spartant-version` markers in Markdown; `release:prepare` bumps the version, folds the notes into `CHANGELOG.md`, rewrites the markers, and writes the pull request body to `.artifacts/`. No Git command is run. The missing-note gate needs Git, so today it warns; CI runs `pnpm release:check --strict --base=origin/main` once the repository exists. Format and mapping in `.changes/README.md`, policy in `packages/spartant/VERSIONING.md`.
- `pnpm dev` - rebuild the package in watch mode.
- `pnpm clean` - remove build output and local artifacts.

Tooling is Biome (format and lint), TypeScript project references, and Vitest. Versions are pinned in the `catalog` in `pnpm-workspace.yaml`; add a shared dependency there rather than inline.

Not yet available, because their tooling has not landed: image-comparing visual regression. HAUX-42 decided against a hosted provider for v0.1; visual review is a person reading the static Storybook artifact CI retains, and `apps/storybook/VISUAL-REVIEW.md` records the comparison, the workflow, and the triage steps. `AGENTS.md` lists the full set that should eventually exist. Do not invent a command, and do not report a check as passing when nothing was run. When you add tooling, add its command here and to `README.md` in the same change.

Both app workspaces are real: Storybook as of HAUX-39, and the Fumadocs documentation site as of HAUX-54. `pnpm dev:docs` serves it and `pnpm build:docs` builds it.

Accessibility checks run in two places, deliberately. `pnpm test:stories` audits every story with axe under happy-dom, which has no layout engine, so colour contrast comes back `incomplete` rather than passing. Rendered contrast is covered by the accessibility panel in the workbench, and the token pairings are proved deterministically by `pnpm check:colors`. Both configurations come from `apps/storybook/src/lib/a11y.ts` so they cannot disagree.

## Workspace layout

Established by HAUX-25. Do not add a new top-level folder without an issue that approves it.

- `packages/spartant` is `@iroshandezilva/spartant`, the only published artifact.
- `apps/storybook` is the component workbench. `pnpm dev:storybook`. Stories resolve the package through its published exports, never a source alias, so a story can only use what a consumer can use.
- `apps/docs` is the Fumadocs site, a Next.js application. `pnpm dev:docs`. It consumes the package through its published `theme.css` export and aliases every Fumadocs `--color-fd-*` role onto a Spartant semantic role, so the documentation is painted by the system it documents and dark mode needs no second palette.
- `examples/consumer` is the clean consumer example.

Dependencies point inward toward the package, using the `workspace:` protocol. The package must never depend on the apps or the example. Shared dependency versions live in the `catalog` in `pnpm-workspace.yaml`; reference them with `catalog:` rather than writing a version inline.

`examples/consumer` is still a minimal placeholder, kept so the workspace graph and its boundaries stay verifiable. Both apps now hold their real tooling.

## Contribution surfaces

- `AGENTS.md` is authoritative and is imported above. `.github/CONTRIBUTING.md` is a short human orientation that defers to it.
- `packages/spartant/src/components/INVENTORY.md` is the v0.1 component inventory and `API-CONVENTIONS.md` the shared component rules. Both are proposed by HAUX-44 and await Iroshan's approval; do not start a component against them until that issue is Done.
- `MANUAL-REVIEW.md` is the manual component review checklist. It covers what `pnpm validate` cannot: visible focus, screen-reader announcements, whether motion is purposeful, and real-device gestures. Run it when a change touches any of the triggers it lists, and paste its result block into the Linear comment and the pull request.
- Pull requests use `.github/PULL_REQUEST_TEMPLATE.md`. Fill every section honestly; never tick a check you did not run.
- `.github/RELEASE.md` is the release runbook from HAUX-60: the npm trusted-publisher settings, the `npm-release` environment protection, the tag-to-verification steps, and the failure table. `.github/workflows/release.yml` is the publish workflow. It runs from a `v*` tag on `main` or as a dry-run rehearsal from `main`, uses OIDC with no stored token, and is the only place the npm CLI runs. Never add a registry token secret.
- `.github/SAMPLE_ISSUE.md` is a rehearsal issue for testing whether this repository's guidance is self-sufficient. It is not tracked in Linear and must never be implemented. Its answer key is in `SAMPLE_ISSUE_RUBRIC.md`; do not read the rubric if you are the session being tested.
- `.claude/skills/spartant-component-builder/SKILL.md` is the repository's own component skill. Use it for component work rather than a general design-engineering skill. It carries the build order, the frozen motion scale, a review mode, and a list of traps that each cost real time in the first slice.
- When a global design-engineering skill is available, use it as reference only. Spartant specifications win every conflict. See the Agent skills section of `AGENTS.md`.

## Styling

Tailwind CSS v4, CSS custom properties as the semantic boundary, no SCSS ever.

- Component styles use **semantic roles only**: `bg-primary`, `text-foreground-muted`, `border-border-strong`. Never a raw value like `bg-[#3b5bdb]`, never a palette step.
- Semantic roles live in `packages/spartant/src/styles/tokens.css` as `--spartant-*`. **The values AND names there are provisional**, and HAUX-32 replaces the file with generated output. Do not treat the values as approved design.
- The token taxonomy, naming grammar, state names, override boundaries and deprecation rules are defined in `packages/spartant/src/tokens/README.md`. Token sources are DTCG JSON under `packages/spartant/src/tokens/`. Read that before adding or renaming a token.
- Three layers: primitives hold literals, semantics only alias primitives, component tokens are rare justified exceptions. States (`hover`, `active`, `selected`, `disabled`, `invalid`, `focus`) are a closed set and always the last name segment.
- `theme.css` maps roles into Tailwind namespaces with `@theme inline`, which is what makes runtime theme switching work. Do not change it to plain `@theme`.
- Adding a source directory to the package means adding an `@source` line in `src/styles/index.css`. Scanning is explicit on purpose.
- Compose classes with `cn` and put the caller's `className` **last**, so it can override.
- Variants are a plain `Record<Variant, string>` lookup of complete class strings. No variant library yet; HAUX-44 decides whether to adopt one.
- Spartant is shadcn-first for comparable components and never shadcn-dependent. A v0.1 component with a strong shadcn equivalent starts from that source unless its issue says otherwise, and follows `packages/spartant/src/components/ADOPTING-SHADCN.md`, whose checklist is derived from real defects found in upstream: an unused declared dependency, a leaked primitive API, and a touch target below the 44px floor. Before it ships, the component must be Spartant-owned code on every axis the checklist names. shadcn is not a runtime dependency and the catalog is never imported wholesale.
- `packages/spartant/src/experiments/` holds experiment evidence. Nothing there is exported from the package entry, and a test asserts it stays that way.

Two consumer paths, both documented in `README.md`: import the precompiled `styles.css` with no Tailwind, or import `theme.css` and add an explicit `@source` if you run Tailwind yourself.

## Git

The working directory is still not a Git repository. There is no history, no remote, and no branch. Do not run `git init` or create a remote without being asked.

## Work intake

Work in this project is driven by Linear issues in the `wearehaux` workspace, under the Spartant design system project. The Linear MCP server is available in this session, so read the issue and its attached specification documents directly rather than working from a paraphrase in chat. `AGENTS.md` links the project brief, architecture decisions, token and color spec, component standard, Storybook strategy, Fumadocs plan, CI/npm/Vercel plan, and roadmap.

## Confirmed release decisions

Frozen in HAUX-26 on 2026-09-08 and recorded in the Linear project brief, architecture document, and CI plan. Treat these as settled inputs and do not re-litigate them; changing one requires a Linear decision issue.

- Package manager: **pnpm**. Never create `package-lock.json` or use npm for workspace commands. The npm CLI is allowed only for the final protected publish step.
- npm package name: **`@iroshandezilva/spartant`**. This is the public API entry point, so consumer imports, the example project's internal `workspace:` dependency, and package metadata all resolve through it.
- Package visibility: **public**. Repository visibility: **public**. Chosen for transparency and automatic provenance. Provenance is the part that requires a public package published from a public repository; trusted publishing through OIDC works with either a public or a private repository, and it is trusted publishing, not the visibility choice, that removes the need for a long-lived npm token.
- Production branch: **`main`**.
- Documentation hosting: the **default Vercel production URL** for the first release. A custom domain is deferred to HAUX-64.
- Visual regression in v0.1: **static Storybook CI artifacts**, no paid hosted provider. Formalized in HAUX-42.
- MVP component inventory: the proposed inventory is the planning baseline; HAUX-44 performs the final review.

Not yet verified: that the npm scope `@iroshandezilva` is an account under Iroshan's control. This machine is not logged in to npm. Confirm before HAUX-60 and HAUX-61.

## Naming

The directory is `spartan`; the system is named **Spartant**. Use `Spartant` in code, package names, documentation, and prose. The directory name is not authoritative and this mismatch is recorded as accepted, so do not raise it again.

## Writing style

`AGENTS.md` forbids em dashes in this project's writing. That applies to code comments, documentation, commit messages, and issue comments, not only prose files.
