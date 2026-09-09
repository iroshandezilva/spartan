# spartant-storybook

The component workbench. Private, never published.

```bash
pnpm dev:storybook     # http://localhost:6006
pnpm build:storybook   # static build into storybook-static/
```

## Writing a story

Copy `src/stories/Button.stories.tsx` and work from there. The structure it
follows, and what is checked automatically, is in
[STORY-TEMPLATE.md](STORY-TEMPLATE.md).

The short version: a story file declares a typed contract covering variants,
sizes, states, motion, accessibility, and manual review; that contract decides
which stories the file must export; and `pnpm test` fails if any of them are
missing.

## How stories resolve the package

Through `@iroshandezilva/spartant`'s **published exports**, over the workspace
link. There is no source alias.

That is deliberate: a story can only use what a consumer can use. An alias to
`src` would let a story import something the package does not export, and the
workbench would quietly stop reflecting the real contract. The cost is that
`pnpm build:package` must run first, which both root commands do for you.

## Theme switching

The toolbar theme control is `@storybook/addon-themes` configured to set
`data-theme` on the root element, which is exactly how Spartant applies a theme.
Switching themes in Storybook therefore exercises the real mechanism rather than
a Storybook-only approximation. If it works here it works in an app.

## Styling

`.storybook/preview.css` contains the same two imports a consumer running their
own Tailwind would write, plus `@source` pointing at the package's `dist`. The
workbench is not a special case.

## Reviewing a visual change

CI retains the static build as an artifact, and that artifact is the visual
review surface for v0.1. No hosted visual-regression provider is used. The
decision, the comparison behind it, the review workflow, and the triage steps
are in [VISUAL-REVIEW.md](VISUAL-REVIEW.md).

```bash
pnpm review:storybook                 # the build in this working tree
pnpm review:storybook path/to/unzip   # a downloaded CI artifact
```

## Known limitations

Prop controls are generated with `react-docgen` rather than
`react-docgen-typescript`. The latter reaches into TypeScript compiler
internals that changed in TypeScript 7 and crashes on this toolchain. The
AST-based reader still extracts prop names and JSDoc; it resolves less type
detail for complex generic props.

Storybook's theme toolbar is a global, so a story that needs a specific theme
pins it with `parameters.themes.themeOverride`. Spartant's theme selector is
`:root[data-theme="dark"]`, so a theme cannot be scoped to part of a page and
light beside dark in one story would need a second document.

Reduced motion is an operating-system setting. The `ReducedMotion` story
simulates it by collapsing the motion tokens on a subtree, the same way the
stylesheet's media rule does, and a test keeps the two in step. Reviewing the
real setting is still a manual step.
