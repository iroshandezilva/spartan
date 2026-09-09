# Separator

A dividing line, horizontal or vertical.

Interim documentation. The Fumadocs site exists since HAUX-54, but the
component pages have not been lifted into it yet, so this lives beside the
source until they are.

## When to use

Between two groups of content that a gap alone does not separate clearly enough.

## When not to use

- **As spacing.** If the only goal is breathing room, use spacing.
- **Around every section.** A page of rules reads as a form, and the meaningful
  ones stop being noticed.

## Import

```tsx
import { Separator } from "@iroshandezilva/spartant";

<Separator />
<Separator orientation="vertical" />
<Separator decorative={false} />
```

## API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Which way the line runs. |
| `decorative` | `boolean` | `true` | Whether the line carries meaning. |
| ...rest | `div` props | | Forwarded. |

## Decorative by default

That default is the whole design. Most rules exist because a gap looked thin,
and announcing every one of them is noise in a screen reader. A decorative
separator is `aria-hidden` and absent from the accessibility tree entirely.

Set `decorative={false}` when the line genuinely divides two groups a
screen-reader user needs to know are separate. It then reports
`role="separator"` with its orientation.

The two look identical on screen, which is why the story suite asserts both.

## Not an `hr`

`hr` is a thematic break between paragraph-level content and carries that
meaning whether or not it fits. It also cannot go vertical without fighting its
own default styling. A `div` that says exactly as much as is true, and nothing
when the line is decorative, is more honest than an element borrowed for its
appearance.

## Motion

**None.** A separator never changes state, so there is nothing for motion to
explain. Animating a static rule would be decoration in a component whose whole
job is to be quiet.

## Tokens

`color.border` for the line, `border-width.default` for the thickness. Separator
is the only component that consumes the border-width token through `var()`
rather than Tailwind's `border` utility, because Tailwind has no border-width
theme namespace to map it into.

## Known limitations

- A vertical separator needs a parent with a resolvable height, typically a
  flex row with `items-stretch`. That is CSS, not the component, and the story
  shows the working shape.
- Resizable split panes are out of scope for HAUX-46.

## Audit against shadcn

Compared with shadcn's `separator` (new-york) in HAUX-69 on six axes: visual
baseline, API clarity, accessibility behaviour, motion contract, semantic token
use, and documentation. Decision: **keep**. Identical behaviour to the Radix primitive without the dependency, and the decorative case is removed from the accessibility tree rather than merely unnamed.
The full comparison, with what was measured, is the
[HAUX-69 audit comment](https://linear.app/wearehaux/issue/HAUX-69/audit-existing-components-against-their-shadcn-equivalents#comment-9182c2bd).
The upstream source it was compared against, and its provenance, are in
[`./upstream/`](./upstream/provenance.json); nothing there is imported.
