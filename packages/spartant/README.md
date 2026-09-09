# @iroshandezilva/spartant

The published component package. This is the only workspace that ships to the
npm registry.

## Boundaries

- Must not depend on the Storybook app, the documentation app, or the example.
  Dependencies point inward only.
- Every public export is re-exported from `src/index.ts`. Internal files must
  not become accidental APIs.
- Product-facing styles use semantic tokens, never raw palette values.

## Public export paths

| Path | Contents |
| --- | --- |
| `@iroshandezilva/spartant` | Components, `cn`, and the generated token surface |
| `@iroshandezilva/spartant/styles.css` | Precompiled stylesheet. One import, no Tailwind needed |
| `@iroshandezilva/spartant/theme.css` | Tokens and Tailwind theme mapping, for apps running their own Tailwind |
| `@iroshandezilva/spartant/tokens.json` | Every token, fully resolved, for tooling that reads values |

These paths are stable. Anything not listed is internal and may change without
a migration note.

## Generated files

Four files are generated from the token sources and committed. Do not edit them
by hand; run `pnpm tokens:build`.

| File | From |
| --- | --- |
| `src/tokens/primitive/color.tokens.json` | The seeds, through the scale contract |
| `src/styles/tokens.css` | The token sources, both themes |
| `src/tokens/generated/tokens.json` | The token sources, fully resolved |
| `src/tokens/generated/tokens.ts` | The semantic token names and `tokenVar` |

`pnpm tokens:check` fails when any of them drifts from the source, and it runs
as part of `pnpm validate`.

## Follow-up issues

- HAUX-24 adds the Tailwind and semantic styling entry point.
- HAUX-32 adds the token source and its CSS, JSON, and TypeScript exports.
- HAUX-61 finalizes package metadata, public exports, license, and version policy.
