# Figma variable snapshot

`spartan-ds.export.json` is a verified read-only export of every local variable in the
[Spartan DS](https://www.figma.com/design/PhcMPmdpkpgxH3N83SvpBY/Spartan-DS) file:
six collections, 461 variables, with Figma's own variable IDs and keys, every mode, and
aliases by variable ID. It is the input to `pnpm tokens:import`, which writes
`tokens/source.json` (`spartan.tokens.v2`), and `pnpm tokens:build`, which writes
`public/tokens.css`.

| Figma collection | Modes | Code key | CSS prefix |
| --- | --- | --- | --- |
| 01 Primitives | Value | `primitives` | `--sp-prim-` |
| 02 Primary | Blue, Purple, Orange, Sky | `primary` | `--sp-hue-` |
| 03 Semantic Color | Light, Dark, Light High Contrast, Dark High Contrast | `semantic-color` | `--sp-` |
| 04 Semantic Foundation | Value | `semantic-foundation` | `--sp-` |
| 05 Component | Value | `component` | `--sp-` |
| 06 Density | Relaxed, Compact | `density` | `--sp-` |

A variable named `button/height/base` in 05 Component becomes the token key
`component.button.height.base` and the property `--sp-button-height-base`. The key
follows the name; the Figma ID and key stored beside it are the stable identity.

## Modes in CSS

Each collection has its own attribute: `data-sp-mode-<code key>="<mode name>"`. The first
mode of each collection is the default on `:root`. Collections feed each other (05
Component aliases 06 Density; 03 Semantic Color aliases 02 Primary and 04 Semantic
Foundation), and a `var()` resolves where it is declared. So every token is re-declared
under the mode selectors of each collection that can change its value, which lets a
nested `data-sp-mode-density="Compact"` re-resolve its subtree.

Limits, enforced by the generator and its tests:

- A token may depend on the modes of at most two collections.
- Tokens that depend on two (semantic colors that alias a Primary hue) are re-declared per
  combination with a compound selector, so set both attributes on one element.
- Opacity primitives are percentages (`50%`), and alpha-bound colors become
  `color-mix(in srgb, <color> <opacity>, transparent)`.

## Failures are explicit

The import throws on: an unmapped collection, an alias to a variable missing from the
export, an alias whose type or unit differs from its target, an alias cycle, a value
shape it does not understand, non-finite numbers, colors outside 0 to 1, a variable
without a value for every mode, a FLOAT family with no unit rule (add it to
`PX_FAMILIES` or handle it in `literalUnit`), and CSS name collisions.

## Refreshing and checking for drift

`use_figma` returns at most 20 KB and cannot make network requests, so a collection is
exported in slices.

1. Run `scripts/figma-export.js` in the file once per slice (edit `NAME`, `FROM`, `TO`).
   Save each full output to `<dir>/NN-name.txt`, in order.
2. `node --import tsx scripts/assemble-figma-export.ts <dir> /tmp/new-export.json`
   verifies every line against its hash and assembles the export.
3. `pnpm tokens:check /tmp/new-export.json` reports added, removed, renamed, and changed
   variables and mode changes against this snapshot, and fails if anything differs.
4. To accept the change, replace `spartan-ds.export.json`, run `pnpm tokens:build`, and
   commit the three generated files together.

`pnpm tokens:check` with no argument only verifies that `source.json` and `tokens.css`
match the committed snapshot. The fixture used by the plugin tests lives in
`tokens/fixtures/lab.json` and is unrelated to this pipeline.
