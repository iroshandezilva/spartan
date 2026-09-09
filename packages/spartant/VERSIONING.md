# Versioning and deprecation

The contract a consumer of `@iroshandezilva/spartant` can rely on when a new
version appears. Decided in HAUX-61. The version rules restate the policy in
the CI, npm Release, and Vercel plan; the rest is what that policy needs to be
enforceable: a definition of the public surface, and a deprecation path.

Documented version: <!-- spartant-version -->0.0.0<!-- /spartant-version -->

## What is public

A version number is only meaningful against a defined surface. This is it.

| Surface | Where it is declared | Covered by |
| --- | --- | --- |
| Named exports of the entry point | `src/index.ts` | Type checking, `smoke/smoke.mjs`, the export inspection in `scripts/inspect-package.mjs` |
| Public props and their types | The exported `*Props` interfaces | Type checking against the packed `.d.ts` in the smoke test |
| Subpath exports: `./styles.css`, `./theme.css`, `./tokens.json`, `./package.json` | The `exports` map in `package.json` | `inspect-package.mjs`, which fails on any other key |
| Semantic and component custom properties, `--spartant-*` | `src/styles/tokens.css`, generated | `pnpm tokens:check`, drift fails |
| Token paths in `tokens.json` and `semanticTokens` | `src/tokens/generated/`, generated | Same |
| Tailwind role names such as `bg-primary`, mapped by `theme.css` | `src/styles/theme.css` | `theme-mapping.test.ts` |
| The `data-theme` attribute and the storage key | `THEME_ATTRIBUTE`, `THEME_STORAGE_KEY` | Exported constants, so a rename is an API change |

Everything else is internal, and the package makes that hard to get wrong
rather than merely saying so. The `exports` map has no wildcard, so
`@iroshandezilva/spartant/dist/lib/cn.js` does not resolve; `files` ships only
`dist`; `src/experiments/` is never re-exported, asserted by test; primitive
tokens have no custom property of their own and are reached only through a
semantic role. Story helpers, tooling, and the generated file layout under
`dist/` carry no compatibility promise.

## Version rules

Semantic versioning, with the meaning of each segment fixed by the kind of
change rather than by its size.

| Bump | Means | Examples |
| --- | --- | --- |
| **Patch** | A compatible fix, or a documentation correction tied to package behaviour | A contrast defect in a token value; a prop that ignored `className`; a wrong type |
| **Minor** | A backward-compatible addition | A new component, variant, size, prop, semantic role, or export |
| **Major** | A change a consumer has to act on | Renaming or removing a prop, export, role, or custom property; changing documented behaviour; changing the package structure or a subpath |

A token value change is a patch when it corrects the value and a major when it
changes what the role means. Moving `primary.surface` two steps so it is
visible against the page is a patch; making `surface.muted` darker than
`surface.default` would be a major, because the roles' relationship is part of
their meaning.

### Below 1.0.0

The rules above apply in full. A breaking change is still a `major` note and
still needs migration guidance. What differs is the arithmetic: below `1.0.0`
a breaking change bumps the **minor** segment, so `0.1.0` plus a breaking
change is `0.2.0`, not `1.0.0`. Reaching a stable major through the first
breaking change of a v0.1 system would be an accident, not a decision.
`pnpm release:prepare --version=` overrides this when `1.0.0` is intended.

`1.0.0` is a decision issue, not a consequence.

### Mechanics

The kind-to-bump mapping the release check enforces, and the note format each
change carries, are in [`.changes/README.md`](../../.changes/README.md).
`pnpm release:check` fails on a bump the kind does not allow and on a `major`
note with no migration section. `CHANGELOG.md` at the repository root is the
consumer-facing record.

## Deprecation

Removing something is a major. Deprecating it first is how a major stops being
a surprise.

1. **Announce in a minor.** The replacement ships alongside the old surface, and
   the old surface is marked: `@deprecated` in JSDoc for an export or prop,
   naming the replacement; `$deprecated` with `replacedBy` and `removeIn` on a
   token, which the token check validates and which propagates to the
   generated outputs. The release note is `kind: api` or `kind: token`, `bump:
   minor`, and says what to migrate to.
2. **Hold for at least one minor.** A deprecated surface keeps working
   unchanged for the whole of the next minor release. A consumer who upgrades
   promptly gets a warning at the type level and a documented path; one who
   does not is not broken.
3. **Remove in a major.** The note is `bump: major` with a `## Migration`
   section, which the release check requires. `removeIn` on a token names this
   version in advance, so the removal is planned, not discovered.

Deprecating a token is a major on its own under the token grammar in
`src/tokens/README.md`; that is deliberate, because a role that stops being
recommended changes what a theme author should target, and this document
does not override it.

No runtime deprecation warnings. A `console.warn` in a component is noise a
consumer cannot silence per site and a bundle cost every user pays. Types and
release notes carry the message.

## Peer and runtime relationships

| Package | Relationship | Why |
| --- | --- | --- |
| `react` | Peer, `^19.0.0` | Imported by shipped source. React 19 is required: `ref` as a prop and `use()` are load-bearing |
| `react-dom` | Not declared | Never imported by shipped source. The components render DOM elements and only make sense with a DOM renderer, but a peer dependency is a resolution contract, not documentation, and this package does not resolve it |
| `clsx`, `tailwind-merge` | Dependencies | The only two. Asserted by `inspect-package.mjs` and by the adoption experiment's test |
| `tailwindcss` | Not required | The precompiled `styles.css` path needs no Tailwind. The `theme.css` path is for consumers who already run it |
| Node | `>=20.19.0` | The `engines` floor for the build and the consumer smoke test, not a runtime requirement of the components |

## Package identity

- Name: `@iroshandezilva/spartant`. The scope is the npm account `iroshandezilva`, confirmed by Iroshan on 9 September 2026. The name was unpublished on the registry at that date.
- Visibility: public, `publishConfig.access: "public"`.
- License: MIT, `LICENSE` beside the manifest so it ships in the tarball.
- Repository, homepage, and bugs fields: **not set**. The working directory is not yet a Git repository and no GitHub repository exists. Inventing a URL would break the provenance link npm checks against the repository field. Add all three in the same change that creates the repository, before HAUX-60 configures trusted publishing.
