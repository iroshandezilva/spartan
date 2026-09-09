# Badge

A compact label for a status or a category.

Interim documentation. The Fumadocs site exists since HAUX-54, but the
component pages have not been lifted into it yet, so this lives beside the
source until they are.

## Import

```tsx
import { Badge } from "@iroshandezilva/spartant";

<Badge variant="warning">In review</Badge>;
```

## The label carries the meaning, never the colour

This is the whole design, and the one rule worth enforcing in review. A badge's
accessible name is its own text, so a red chip reading `3` announces itself as
`3`. The colour reaches neither a screen-reader user nor a reader who cannot
separate red from green, and it does not survive a greyscale print either.

Write `3 failed`, not `3`. Write `In review`, not a yellow dot.

The tint is reinforcement. Every variant is readable, and says what it means,
with the colour removed entirely.

## Variants

Seven, named for meaning. Choosing one is a question about the thing being
labelled, not about the palette.

| Variant | For |
| --- | --- |
| `neutral` | A category rather than a status. The default. |
| `primary` | The thing the product is steering towards. |
| `accent` | A second category that has to be told apart from neutral. |
| `success` | Completed or healthy. |
| `warning` | Needs attention, not yet failing. |
| `danger` | Failed, blocked, or destructive. |
| `information` | Context the user does not have to act on. |

`neutral` is the default deliberately. Most badges in a product are categories,
and a system whose default is a status colour is one where `Design` ends up red.

There is no `secondary` variant. `secondary` is a filled role with no `text` or
`surface` pair, so it has no tint to be a badge with.

## No sizes

One size, at caption type. A badge is already the smallest thing on the page,
and a scale would mostly be used to make it compete with the text beside it.

## Non-interactive by construction

A `span` with no role, no `tabIndex`, and no handlers. A badge that can be
clicked is a button; a badge that can be dismissed is a button inside a badge.

To make one interactive, compose it:

```tsx
<button type="button" className="rounded-pill focus-visible:outline-2 ...">
  <Badge variant="primary">Filter by: Frontend</Badge>
</button>
```

The button brings focus, keyboard activation, and a hit area, none of which a
`span` acquires by having a handler attached to it. `BadgeIsInert` in the story
file asserts this, so it fails the moment someone adds a `tabIndex` to make one
case convenient.

## Icons

Any glyph is decorative and must be hidden, because the label is already the
name:

```tsx
<Badge variant="success">
  <span aria-hidden="true">●</span>
  Live
</Badge>
```

## Inline in running text

The chip is 20.2px: caption type at its snug line height, plus 2px above and
below. That is deliberately sized from the line box rather than from the look,
so a badge dropped into a sentence does not reflow it. Measured in the
`Composition` story, a three-line body-small paragraph containing two badges is
63.91px against a 63px paragraph without them, so the cost is under a pixel for
the whole paragraph rather than 3px per line.

It was 24.2px until that measurement was taken, which reflowed every line a
badge appeared on.

## Long labels

No `whitespace-nowrap`. A long label wraps inside the chip rather than running
out of a narrow column, and the pill radius stays correct at any height because
it is larger than any height the chip can reach. Both cases are in the `States`
story, in a deliberately narrow container.

## Motion

None. A badge does not change state in response to the user. Its text can be
replaced when the thing it labels changes, but that is a content change in
someone else's component, and animating it here would mean owning a transition
whose start and end this component cannot see.

## Tokens

Semantic: `color.surface.muted`, `color.foreground.default`, and the `surface`
and `text` pair of each of the six tint families; `radius.pill`,
`font.size.caption`, `font.line-height.caption`, `font.weight.emphasis`.

Component: `badge.padding-x`, `badge.padding-y`, `badge.gap`. Justified in
`../../tokens/component/badge.tokens.json`: the control spacing roles size a box
a finger presses, and they make a caption-sized chip half again too large.

## Contrast

Text on its own tint measures 6.1 to 7.0 in light and 11.1 to 11.5 in dark,
against a 4.5 floor. Every pair is one family's `text` on the same family's
`surface`, and `pnpm check:colors` validates all of them in both themes, so
there is no combination a caller can reach that has not been measured.

## Known limitations

- **A tint is invisible on `surface.muted`.** All the ramps share one lightness
  ladder, and the surface roles occupy rungs of it, so a tint placed to clear
  `background.default` and `surface.default` lands on the same rung as
  `surface.muted` and measures 1.00 to 1.02 against it. A badge on a recessed
  surface reads as coloured text rather than as a chip. Fixing it properly means
  a tint that is not a rung of the shared ladder, which is a token-system change
  rather than a component one. `tooling/tokens/tint-separation.test.ts` holds
  the two grounds that were fixed and names this one as the exclusion.
- **The tints moved during this issue.** Light went from step 50 to 100 and dark
  from 900 to 950, because every one of them measured exactly 1.00 against a
  ground and so was not visible in greyscale at all. Badge was their first
  consumer, so nothing else was affected.
- No dot, count, or removable variants. Out of scope for HAUX-45.

## Audit against shadcn

Compared with shadcn's `badge` (new-york) in HAUX-69 on six axes: visual
baseline, API clarity, accessibility behaviour, motion contract, semantic token
use, and documentation. Decision: **keep**. The upstream defects HAUX-65 catalogued (a `div` in running text, `focus:` on a non-focusable element, an opacity hover, an unused dependency) are all absent here.
The full comparison, with what was measured, is the
[HAUX-69 audit comment](https://linear.app/wearehaux/issue/HAUX-69/audit-existing-components-against-their-shadcn-equivalents#comment-9182c2bd).
The upstream source it was compared against, and its provenance, are in
[`./upstream/`](./upstream/provenance.json); nothing there is imported.
