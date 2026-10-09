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

## Resolving a mode combination

A token's value is picked per collection, each mode independent. For example
`semantic-color.color.primary.default` is `color/primary/600` in Light and Dark, `/800` in Light High
Contrast, and `/300` in Dark High Contrast, and `color/primary/600` itself is a color per hue: Blue
`#006dce`, Purple `#8933e4`, Orange `#ad5000`, Sky `#007a9b`. So Dark High Contrast with Sky resolves
to Sky's step 300. `resolveToken(source, key, { 'semantic-color': 'Dark', primary: 'Orange' })` in
`lib/figma-tokens.ts` does this, and the tests compare it with the generated CSS for all 32
combinations of hue, theme, and density. What Button and Icon Button bind to is in `bindings.md`.

## Unsupported and flagged values

Reviewed against the file on 2026-10-09. The import handles each case explicitly or fails.

- **Alpha-bound colors (14):** a color alias plus an opacity alias, for example `color/dashed/*`,
  `color/danger/subtle/*`, `color/shadow/*`, `color/surface/faint`, `color/backdrop/drawer`, and
  `color/border/overlay` in Light. Supported as `color-mix(in srgb, color opacity, transparent)`; the
  opacity must be a percent token.
- **Opacity is a percentage:** primitives hold 0 to 100, so CSS gets `50%`, which is also valid for the
  CSS `opacity` property.
- **FLOAT has no unit in Figma:** literals get `px` or percent from their name family, line heights
  such as `font/line-height/normal` and font weights are unitless, and aliases inherit the unit. A
  new family fails the import until a rule is added.
- **Names:** `radius/sm 2` contains a space, so its key is `primitives.radius.sm-2`.
- **Code syntax is not trusted:** 33 variables have none, three strings are shared by two variables
  (`radius/sm`, `border-width`, `border-width-emphasis`), and the prefixes are inconsistent
  (`--spartant-` on 412, `--spartan-` on 6, others unprefixed or `--color-`, `--select-`, `--switch-`,
  `--space-`). Code names come from collection and name instead. Only the WEB syntax was exported.
- **Not variables in this file:** composite typography, gradients, and shadows (shadows are effect
  styles whose colors are variables).
- **Fails the import:** an unresolved alias, a type or unit mismatch, a cycle, an unsupported value
  shape, a color outside 0 to 1, a missing mode value, an unmapped collection, and a CSS name
  collision. See below.

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
