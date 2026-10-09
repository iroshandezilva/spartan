# Figma variable snapshot

`spartan-ds.export.json` is a verified read-only export of every local variable in the
[Spartan DS](https://www.figma.com/design/PhcMPmdpkpgxH3N83SvpBY/Spartan-DS) file:
seven collections, 547 variables, with Figma's own variable IDs and keys, every mode, and
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
| 07 Style | Atlas, Selene, Helios, Ares | `style` | `--sp-` |

A variable named `button/height/base` in 05 Component becomes the token key
`component.button.height.base` and the property `--sp-button-height-base`. The key
follows the name; the Figma ID and key stored beside it are the stable identity.

## Modes in CSS

There is one attribute per independent setting, `data-sp-mode-<setting>="<value>"`:

| Setting | Attribute | Values | Default |
| --- | --- | --- | --- |
| Style | `data-sp-mode-style` | Atlas, Selene, Helios, Ares | Atlas |
| Color scheme | `data-sp-mode-color-scheme` | Light, Dark | Light |
| Contrast | `data-sp-mode-contrast` | Normal, High | Normal |
| Brand hue | `data-sp-mode-primary` | Blue, Purple, Orange, Sky | Blue |
| Density | `data-sp-mode-density` | Relaxed, Compact | Relaxed |

With no attribute anywhere the result is Atlas, Light, normal contrast, Blue, and Relaxed.

**High contrast is its own setting.** Figma keeps four combined Semantic Color modes (Light, Dark,
Light High Contrast, Dark High Contrast) and that stays as source data, but the code boundary splits
them into color scheme and contrast (`COLLECTION_RULES` in `lib/figma-tokens.ts`; the source file
records `axes` and `modeAxes`). So `Dark High Contrast` is color scheme Dark with contrast High,
high contrast composes with every style and both schemes, and no combined value is exposed. Setting
only `contrast="High"` keeps the default Light scheme: Light High Contrast.

**How the CSS composes the settings.** Each axis is carried by inherited toggle variables
(`--_sp-not-style-helios` and so on). An attribute sets its own axis' toggles on its element and
leaves every other axis inherited. A token whose value differs per mode is one expression that picks
its value from the toggles, and it is declared again wherever an axis it depends on can change,
because `var()` resolves where it is declared. A toggle is `initial` when its value is selected and
empty when it is not, so `var(--toggle, value)` gives `value` only for the selected mode and the
terms concatenate to exactly the selected value. Consequences, all tested in a CSS cascade
simulator and in Chromium:

- Settings are independent at any depth: a nested element that sets only the color scheme keeps the
  page's contrast, style, hue, and density, and the same for each of the five settings.
- Any number of settings can matter to one token (`style.field.border.hover` depends on style,
  color scheme and contrast, and hue), and they can be set on different elements.
- There are no compound selectors and no specificity tricks; every token is declared once.

Opacity primitives are percentages (`50%`), and alpha-bound colors become
`color-mix(in srgb, <color> <opacity>, transparent)`. The toggles use empty custom property values,
which current evergreen browsers support; they were verified in Chromium only.

```html
<html data-sp-mode-style="Selene" data-sp-mode-color-scheme="Dark" data-sp-mode-contrast="High" data-sp-mode-primary="Purple">
  <section data-sp-mode-density="Compact"> <!-- Compact inside, everything else inherited -->
    <sp-button>Save</sp-button>
  </section>
  <aside data-sp-mode-color-scheme="Light"> <!-- Light inside, still high contrast and Selene -->
  </aside>
</html>
```

### Code API and migration

Use `@spartan/components/theme` instead of writing attributes by hand:

```ts
import { applyTheme, fromLegacyTheme } from '@spartan/components/theme';

applyTheme(document.documentElement, { style: 'Helios', colorScheme: 'Dark', highContrast: true, hue: 'Purple', density: 'Compact' });
applyTheme(document.documentElement, { highContrast: false }); // only contrast changes
applyTheme(section, { colorScheme: null });                    // inherit the color scheme again
```

Only the fields you pass change; `null` removes a setting from that element; invalid values throw and
change nothing. A test checks the constants and attribute names against `tokens/source.json`.

Migrating from the earlier combined theme value (`data-sp-mode-semantic-color`, which is gone):

| Before | Now |
| --- | --- |
| `data-sp-mode-semantic-color="Light"` | `data-sp-mode-color-scheme="Light"` (or no attribute) |
| `data-sp-mode-semantic-color="Dark"` | `data-sp-mode-color-scheme="Dark"` |
| `data-sp-mode-semantic-color="Light High Contrast"` | `data-sp-mode-color-scheme="Light" data-sp-mode-contrast="High"` |
| `data-sp-mode-semantic-color="Dark High Contrast"` | `data-sp-mode-color-scheme="Dark" data-sp-mode-contrast="High"` |

`fromLegacyTheme('Dark High Contrast')` returns `{ colorScheme: 'Dark', highContrast: true }`. In
tests, `assignmentFromAttributes(source, { 'color-scheme': 'Dark', contrast: 'High' })` gives the
combined Figma mode, and `resolveToken` accepts either form.

### Storybook

The toolbar has Style, Theme (Light or Dark), Hue, and Density dropdowns that show their current
value, and a **High contrast** switch (off by default) beside them. All five are Storybook globals,
so a shared link reproduces them, for example
`?globals=style:Helios;theme:Dark;highContrast:!true;hue:Purple;density:Compact`. They apply to
canvases and Docs previews, stay when you move between stories, and are keyboard accessible. A
shared link from before the split with `theme:Dark High Contrast` still opens Dark with high contrast
on.

## Resolving a mode combination

A token's value is picked per collection, each mode independent. For example
`semantic-color.color.primary.default` is `color/primary/600` in Light and Dark, `/800` in Light High
Contrast, and `/300` in Dark High Contrast, and `color/primary/600` itself is a color per hue: Blue
`#006dce`, Purple `#8933e4`, Orange `#ad5000`, Sky `#007a9b`. So Dark High Contrast with Sky resolves
to Sky's step 300. `resolveToken(source, key, { 'color-scheme': 'Dark', contrast: 'High', primary: 'Orange' })` in
`lib/figma-tokens.ts` does this (a combined mode name such as `'semantic-color': 'Dark High Contrast'`
works too), and the tests compare it with the generated CSS for all 128
combinations of style, hue, color scheme, contrast, and density, in a CSS cascade simulator and in Chromium. What Button and Icon Button bind to is in `bindings.md`.

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
  `--space-`). Code names come from collection and name instead. The 86 variables Figma named
  `--sp-...` (07 Style and the new `color/style/*` helpers) equal the generated names exactly, and a
  test keeps it so. Only the WEB syntax was exported.
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

`use_figma` returns at most 20 KB and cannot make network requests, so a full export is slow.
Find what changed first, then fetch only that.

1. Run `scripts/figma-manifest.js` in the file and save the output to a text file. It lists a hash
   for every variable and for every collection header.
2. `pnpm tokens:manifest <manifest.txt>` compares it with this snapshot and prints the variables
   that were added, changed, or removed per collection, and whether a header (name or modes)
   changed. It exits 1 when anything differs, so it doubles as a cheap drift check.
3. Fetch the difference with `scripts/figma-export.js`. For a few variables set `IDS` (the header
   is then marked partial); for a new or heavily changed collection export it in slices (`FROM`
   and `TO`). Save each full output to `<dir>/NN-name.txt`, in order.
4. `node --import tsx scripts/assemble-figma-export.ts <dir> /tmp/new-export.json <date> --base
   tokens/figma/spartan-ds.export.json` verifies every line against its hash, merges partial
   outputs into the collections they name, replaces a collection whose output has a full header,
   adds new collections, and keeps everything else and the snapshot's order.
5. `pnpm tokens:check /tmp/new-export.json` reports added, removed, renamed, and changed
   variables and mode changes against this snapshot, and fails if anything differs.
6. To accept the change, replace `spartan-ds.export.json`, map any new collection in
   `COLLECTION_RULES` and any new FLOAT family in `PX_FAMILIES` (`lib/figma-tokens.ts`), run
   `pnpm tokens:build` and `pnpm test`, and commit the generated files together.

The 07 Style refresh (2026-10-09) followed these steps: the manifest showed 5 added Semantic Color
variables and the new collection, and nothing else had changed, so only 86 variables were fetched.

`pnpm tokens:check` with no argument only verifies that `source.json` and `tokens.css`
match the committed snapshot. The fixture used by the plugin tests lives in
`tokens/fixtures/lab.json` and is unrelated to this pipeline.
