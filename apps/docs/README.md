# spartant-docs

The Fumadocs documentation application. Private, never published.

Vercel deploys this app from the `main` branch only, with non-production builds
ignored. Deployment is governed by [`DEPLOYMENT.md`](./DEPLOYMENT.md): only
`main` deploys, per-branch previews are excluded, and the settings,
verification, and rollback steps are defined there.

Dependency direction is one way. Documentation consumes the package through its
public entry point. The package must never import from this app.

## Commands

Run from the workspace root, so the package is rebuilt first:

- `pnpm dev:docs` starts the dev server on <http://localhost:3100>.
- `pnpm build:docs` produces the production build.

Inside `apps/docs`, `pnpm build`, `pnpm dev`, and `pnpm typecheck` do the same
without rebuilding the package. They need `pnpm build:package` to have run at
least once, because this app imports the package's compiled stylesheet.

## Layout

| Path | Holds |
| --- | --- |
| `app/` | Routes. `(home)` is the landing shell, `docs/` is the documentation shell. |
| `app/global.css` | The single stylesheet entry point. |
| `app/spartant-theme.css` | Maps Fumadocs UI's roles onto Spartant tokens. |
| `content/docs/` | MDX pages and the `meta.json` files that order them. |
| `lib/source.ts` | The content collection and the page tree the layouts read. |
| `lib/layout.shared.tsx` | Navigation options shared by both shells. |
| `components/mdx.tsx` | Components every MDX page can use without an import. |
| `components/demo/` | Live Spartant examples: a server wrapper per component plus a client half where interaction is needed, importing only from the package. `MotionModes` renders an interactive example under normal and reduced motion side by side. |
| `components/docs/` | Pieces every component page shares: the `Prerelease` notice, read from the package manifest, and the `Stories` coverage table. |
| `components/foundation/` | Foundation specimens and tables, rendered from the published token JSON at build time so they cannot drift from the package. |
| `lib/tokens.ts` | Reads `@iroshandezilva/spartant/tokens.json` and derives custom property names by the token grammar. Server components must not import the package's JavaScript entry point, because it re-exports `ThemeProvider`. |
| `lib/contrast.ts` | WCAG contrast from `oklch()` values, the same arithmetic as the package's colour audit. |
| `lib/pairings.ts` | The required contrast pairings, mirroring `packages/spartant/tooling/tokens/pairings.ts`. |

## Styling

This app is a consumer, not an insider. It imports
`@iroshandezilva/spartant/theme.css` by its published export path and declares
an explicit `@source` for the package's compiled output, which is the same
Tailwind path documented for anyone else. It never reaches into the package's
source.

Fumadocs UI's stock colour file is deliberately not imported. Every
`--color-fd-*` role is aliased to the Spartant semantic role that means the same
thing in `app/spartant-theme.css`, so the site is painted by the system it
documents. Because those aliases are declared with `@theme inline`, dark mode
needs no second set of values: it follows the package's tokens.

## Themes

One control switches both systems. The Fumadocs provider is configured to write
`class` and `data-theme` together, because Fumadocs UI keys its dark styles off
the `.dark` class while Spartant's tokens key off `data-theme`.

## Machine-readable entry points

- `/llms.txt` indexes every published page.
- `/llms-full.txt` concatenates them as Markdown.

Both are generated from the same page tree the site renders, so neither can fall
behind the content.

## Adding a page

1. Add an `.mdx` file under `content/docs/`, with `title` and `description` in
   its frontmatter.
2. Add its file name to the `pages` array in the nearest `meta.json`.
3. A new directory needs its own `meta.json` with a `title`, and its name added
   to the parent's `pages`.

## Component pages

One page per released component or family under `content/docs/components/`,
following the sixteen-section template from the Fumadocs information
architecture, in this order: purpose and when to use; when not to use; import
and minimal example; anatomy; public API; variants and sizes; required states;
accessibility and keyboard behaviour; motion purpose or no-motion rationale;
input modality, interruption, and reduced motion; motion tokens and
implementation approach; theming and token dependencies; composition examples;
testing notes; known limitations; changelog. `button.mdx` is the worked
example.

Each page opens with `<Prerelease />`, embeds a live example from
`components/demo/`, links Storybook coverage with `<Stories />` by story file
and story name, and declares `keywords` covering the component names, the
public prop names, and the semantic token roles it consumes, so search finds
it by any of them. The story file's `contract` object is the source of truth
for the accessibility, keyboard, motion, and manual-check sections; the page
must agree with it.

## Search keywords

Pages may declare `keywords` in frontmatter. The page schema in `lib/source.ts`
adds the field, and the search route appends the keywords to each page's
indexed content, so a token name or a prop name finds its page even when the
body never spells it that way.

## Known gaps

- The Start, Foundations, and Components sections are written. Pattern,
  contributing, and release pages are separate issues.
- `/llms-full.txt` carries each page's prose but not the tables generated by
  `components/foundation/`, which exist only in the rendered HTML.
- Search is the built-in static index. It has not been evaluated against the
  search requirements in the documentation plan.
- The Fumadocs theme toggle logs `InvalidStateError: Transition was aborted`
  when its view transition is interrupted. The theme still switches. It comes
  from the Fumadocs UI control, not from this app's code.
- `app/global.css` carries one `@source not inline(...)` exclusion, explained in
  place, working around a package code comment that Tailwind's scanner reads as
  a class name.
