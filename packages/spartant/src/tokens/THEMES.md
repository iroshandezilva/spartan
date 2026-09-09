# Light and dark semantic mappings

Decided in HAUX-33. Which primitive step each semantic role points at, in each
theme, and why.

The mapping is enforced, not just described: `packages/spartant/tooling/tokens/`
runs the full contrast matrix over both themes on every test run.

## How a theme works

**Light is the base.** `semantic/` holds the complete mapping. `theme/dark.tokens.json`
restates only the roles that differ. There is no second palette to keep in step,
and a role added to the light mapping cannot be silently missing from dark: it
inherits until someone overrides it.

Roles alias primitive steps and never hold literals, so no mapping name mentions
a colour. `color.primary` points at `{color.primary.600}` in light and
`{color.primary.400}` in dark; nothing in the semantic layer says "blue".

## Surfaces

The whole system rests on surfaces separating from each other. In dark
especially, four near-blacks that measure almost the same are the fastest way to
make a selected row invisible.

| Role | Light | Dark | Reads as |
| --- | --- | --- | --- |
| `background` | `neutral.50` | `neutral.1000` | The page |
| `surface` | `neutral.0` | `neutral.900` | A card on the page |
| `surface.elevated` | `neutral.0` | `neutral.800` | A popover above the card |
| `surface.muted` | `neutral.100` | `neutral.950` | A recessed panel |
| `surface.disabled` | `neutral.100` | `neutral.950` | An inert control |
| `surface.selected` | `primary.100` | `primary.800` | A chosen row |

Dark runs `1000 < 950 < 900 < 800`, so background, recessed, surface, and raised
each occupy their own lightness. `selected` is tinted **and** moved, so it does
not depend on colour perception alone.

### Elevation is carried differently in each theme

In dark, `surface.elevated` is a lighter step than `surface`, because there is
headroom above it.

In light, `surface` is already pure white and `surface.elevated` is **the same
value**. Nothing is lighter than white, so elevation in light is carried by
shadow, which is what `elevation.overlay` is for. A popover over a card is
separated by its shadow and its border, not by its fill.

This is asserted in both directions rather than left implicit: dark must
separate by lightness, light must match exactly. If the light surface ever stops
being pure white the test fails, and the decision gets revisited instead of
quietly becoming a near-invisible one-step difference.

The first draft of this mapping put `surface.selected` and `surface.disabled` at
`neutral.900` in dark, identical to `surface`. Both are now checked, because a
selected row that looks exactly like an unselected one is not a subtle problem.

## Text

| Role | Light | Dark | Notes |
| --- | --- | --- | --- |
| `foreground` | `neutral.900` | `neutral.50` | Body copy |
| `foreground.muted` | `neutral.700` | `neutral.400` | Still text, still checked at 4.5:1 |
| `foreground.inverse` | `neutral.50` | `neutral.1000` | On an inverted surface |
| `foreground.disabled` | `neutral.500` | `neutral.600` | Exempt, see below |

`foreground.muted` sits at step 700 rather than 600 in light. Secondary text is
read at body size, so it takes the body threshold; "muted" describes emphasis,
not permission to be hard to read.

## Borders and focus

| Role | Light | Dark |
| --- | --- | --- |
| `border` | `neutral.200` | `neutral.800` |
| `border.subtle` | `neutral.100` | `neutral.900` |
| `border.strong` | `neutral.500` | `neutral.600` |
| `focus-ring` | `primary.600` | `primary.400` |

`border` and `border.subtle` are decorative and carry no minimum.
`border.strong` carries state, so it takes the 3:1 non-text threshold.

The focus ring is checked against **three** surfaces in both themes: the page,
a card, and a raised surface. A ring that is visible on the page and vanishes
inside a dialog is the failure this catches, and it is the one keyboard users
actually hit.

## Actions and status

| Role | Light | Dark |
| --- | --- | --- |
| `primary` | `primary.600` | `primary.400` |
| `primary.hover` | `primary.700` | `primary.300` |
| `primary.active` | `primary.800` | `primary.200` |
| `secondary` | `secondary.100` | `secondary.900` |
| `accent` | `secondary.600` | `secondary.400` |
| `success` `warning` `danger` `information` | family `600` | family `400` |

Hover and active move **away** from the page in light and **toward** it in dark,
which is what keeps a pressed control looking pressed in both. Every state is
checked to differ from its resting state by at least 0.02 in OKLCH lightness,
so states are distinguishable rather than merely different values.

Every filled role carries its own `foreground`, checked against the filled
surface at the body-text threshold, including on hover and active. A label that
is legible at rest and not while pressed is a real failure and now a caught one.

## Disabled

Disabled is **exempt from a contrast minimum**. That is WCAG's rule, not a
Spartant shortcut, and it exists because a disabled control that meets full
contrast reads as enabled.

Spartant still does two things rather than treating exempt as unmeasured:

1. The pairing is listed and measured, so the number appears in the output
   instead of the pairing being forgotten.
2. `surface.disabled` must differ measurably from `surface`, so a disabled
   control is identifiable as disabled rather than merely unresponsive.

Disabled state is never carried by colour alone. The `disabled` attribute
carries it for assistive technology, and the colour is a secondary cue.

## The contrast matrix

Every required pairing is defined in `tooling/tokens/pairings.ts` and checked in
**both themes** on every test run. A role only has to work where it is used, so
that list is the definition of where each role is used. Adding a role that
carries text or state means adding its pairing; a role with no entry is a claim
that it never sits against anything that matters.

Current state: **49 required pairings, 98 checks across the two themes, all
passing, zero exceptions recorded.**

Thresholds, the exception path, and the reasoning are in [`COLOR.md`](./COLOR.md).

## Ownership

| Area | Owner |
| --- | --- |
| This mapping | HAUX-33 |
| The scale and contrast policy behind it | HAUX-31 |
| Enforcement in CI | HAUX-37 |
| Applying a theme at runtime | HAUX-35 |
