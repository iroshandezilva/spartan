# Card

A surface that groups related content.

Interim documentation. `apps/docs` lifts this into Fumadocs under HAUX-56;
until then it lives beside the source.

## When to use

To group a heading, some content, and the actions that belong to them on one
surface, so a page of many things reads as a page of things rather than a
column of text. A project in a list, a setting with its own save button, a
summary with a number in it.

## When not to use

- **As a clickable thing.** A card is a container, and making the whole surface
  a link or a button is a separate decision with its own focus, press, and
  nested-control rules. Put a real link or button inside the card instead. See
  [Not interactive](#not-interactive).
- **Around everything.** A page where every paragraph has a border and a shadow
  has no hierarchy left. Cards separate groups; they do not decorate content.
- **For a modal task.** That is `Dialog`, which owns focus and dismissal.

## Import

```tsx
import {
  Card,
  CardActions,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@iroshandezilva/spartant";

<Card>
  <CardHeader>
    <CardTitle>Checkout rewrite</CardTitle>
    <CardDescription>Replaces the three-step flow with a single page.</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Merged into main yesterday.</p>
  </CardContent>
  <CardActions>
    <Button size="sm">Open</Button>
  </CardActions>
</Card>;
```

## Anatomy

```
Card                  the surface: padding, radius, border, elevation, text colour
  CardHeader          title and description, with the tighter control gap between them
    CardTitle         a real heading, h3 by default
    CardDescription   muted supporting text
  CardContent         the body; a plain box
  CardActions         a wrapping row of controls
```

**No part is mandatory.** The card is a grid with the stack gap between its
children and the surface padding around them, so any part can be left out and
nothing leaves a hole. A card with only a paragraph in it is a legitimate card.
Parts do not depend on a context and work anywhere, which is also why they add
no behaviour: each one is an element with type on it and a `className`.

## API

### Card

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `"raised" \| "flat"` | `"raised"` | How the card separates from its ground. See [Variants](#variants). |
| `className` | `string` | | Merged last, so it overrides. |
| `ref` | `Ref<HTMLDivElement>` | | The outer surface. |
| ...rest | `div` props | | Forwarded. |

### CardTitle

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `level` | `2 \| 3 \| 4 \| 5 \| 6` | `3` | The heading level. See [Heading level](#heading-level). |
| ...rest | heading props | | Forwarded. `ref` points at the heading. |

### CardHeader, CardContent, CardActions

`div` props, forwarded. `ref` points at the element.

### CardDescription

`p` props, forwarded. `ref` points at the paragraph.

## Variants

Two, and both are pairings from `tokens/FOUNDATIONS.md` rather than free
choices. Elevation is always paired with a border and a background, because
each theme leans on a different cue: in light `surface` is already white so
the shadow does the separating, and in dark a shadow against a dark surface is
nearly invisible so the lighter fill does.

| Variant | Elevation | Border | For |
| --- | --- | --- | --- |
| `raised` | `elevation.surface` | `border.subtle` | A card on the page background. The default. |
| `flat` | `elevation.flat` | `border` | A card inside another surface, or one of many in a dense list where a shadow on each is noise. |

Nested cards go flat. A raised card inside a raised card stacks two shadows
that mean nothing, and the story suite shows the working shape.

## Not interactive

A card is a `div` with no role, no `tabIndex`, and no handlers of its own. The
only things reachable inside it are the controls a caller puts there, in
document order, and the story suite asserts that Tab reaches each of them and
never the card.

Clickable-card behaviour is out of scope for HAUX-47 by decision. When it is
built it takes the same press rules as any pressable control, and it will need
an answer for what happens to the buttons inside a card that is itself a
button. Until then, a caller who wants a card to lead somewhere puts a link in
it.

## Heading level

`CardTitle` renders a real heading, where the shadcn source it started from
renders a `div`. Both look identical. Only one of them lets a screen-reader
user jump between the cards on a page, which is the one thing a card can
contribute to the accessibility tree.

The level defaults to 3 because a card usually sits under a page title and a
section heading. It is a prop because the outline belongs to the page, not to
the component: a card that is the main thing on a page is a 2, and a card
nested inside another card is a 4. Set it so headings do not skip a level.

## States

| State | Behaviour |
| --- | --- |
| Empty | The padding holds the shape. No collapse to a line. |
| Long content | Text wraps inside the radius and padding, including an unbroken token in the title. The card and header pin their grid column to `minmax(0,1fr)` so no child can widen the track, and `break-words` then breaks the word. Actions wrap onto a second row rather than overflowing. |
| Narrow width | Shown at a 320px column in the `NarrowWidth` story. Nothing scrolls or clips. |
| Nested | A flat card inside a raised one keeps the same radius. |
| Light and dark | See [Tokens](#tokens) for the measured separation in each. |

Hover, focus, active, disabled, selected, invalid, loading, and read-only do
not exist for a container. Declaring them would be dishonest.

## Accessibility

- **Role:** none. A card is a generic container, not a landmark. Every card as
  a `region` would fill a page's landmark list with twenty entries.
- **Name:** none on its own. The title is a heading, so the card is findable by
  heading navigation. Pass `aria-labelledby` pointing at the title's `id` to
  make one specific card a named group.
- **Keyboard:** not focusable. Nested controls are reached in document order.
- **Focus:** the card sets no `overflow`, so a nested control's focus ring is
  not clipped, and the surface padding keeps the ring inside the edge. A caller
  who adds `overflow-hidden` for a full-bleed image takes on that risk.
- **Announcements:** none. A card whose content changes and must be announced
  belongs inside a live region owned by whatever changes it.

## Motion

**None.** A card has no open, selected, or pressed state of its own, so there
is nothing for motion to explain, and the Motion and Micro-interaction Standard
names Card as no-motion by default. The controls inside a card keep their own
motion contracts. An interactive card would take the press rules of any
pressable control, and that is a separate decision.

## Tokens

All semantic roles. No component token: every requirement here is a stable
semantic role already, and a card token would only duplicate one.

| Role | Used for |
| --- | --- |
| `color.surface` | The fill |
| `color.foreground` | Text colour, set on the surface so content inherits it |
| `color.foreground.muted` | The description |
| `color.border.subtle` | The raised border |
| `color.border` | The flat border |
| `elevation.surface` / `elevation.flat` | The shadow per variant |
| `radius.surface` | The corners |
| `space.surface-padding` | Padding |
| `space.stack-gap` | Between parts |
| `space.control-gap` | Between title and description, and between actions |
| `font.size.heading-small`, `font.line-height.heading`, `font.tracking.heading` | The title |
| `font.size.body-small` | The description |

Measured with `tooling/color/oklch.js` while building, against the grounds a
card actually sits on:

| Pairing | Light | Dark |
| --- | --- | --- |
| `surface` on `background` | 1.06 | 1.27 |
| `border.subtle` on `surface` (raised) | 1.16 | **1.00** |
| `border` on `surface` (flat) | 1.31 | 1.42 |
| `foreground` on `surface` | 16.00 | 15.10 |
| `foreground.muted` on `surface` | 7.44 | 6.94 |

Text passes body thresholds in both themes with room to spare. The borders are
decorative and carry no minimum, and the raised border in dark is the row to
know about: see [Known limitations](#known-limitations).

## Testing

- `Card.test.tsx` beside the source: the element, the ref, the variants, that
  `cn` keeps every default class and lets the caller's override win, that the
  title is a heading at each level, that nothing in a full composition is
  focusable except the caller's controls, and that the adaptation stayed
  adapted (no shadcn import, no shadcn token name, no raw scale step, and the
  upstream snapshot still has the constructs that were removed).
- `Card.stories.tsx`: `NestedControls` drives Tab through a card and asserts
  the order; `HeadingLevels` asserts the heading roles. Every story is audited
  by axe.
- Manual: both themes, the 320px column at 200% zoom, and the focus ring on
  nested controls. The result block is on HAUX-47.

## Known limitations

- **The raised border is invisible in dark.** `border.subtle` and `surface`
  both resolve to the same neutral step in the dark theme, so a raised card in
  dark separates from the page by fill (lightness 25% on 12%) and shadow only.
  It still reads as a surface, and `THEMES.md` is explicit that dark separates
  by lightness, but a raised card on a `surface`-coloured ground in dark would
  have no edge at all. Use `flat` there. Whether `border.subtle` should sit a
  step above `surface` in dark is a token decision, recorded on HAUX-47.
- **No clickable card.** Out of scope by decision; see
  [Not interactive](#not-interactive).
- **No media slot.** A full-bleed image needs negative margins against the
  surface padding, and a caller adding `overflow-hidden` for it will clip focus
  rings at the edge. Reopen when a prototype needs one.
- **Parts carry no context.** A `CardTitle` outside a `Card` is just a heading.
  That is deliberate, and it means the card cannot wire `aria-labelledby` to its
  own title automatically; pass it by hand when a named group is wanted.

## Provenance

Adapted from shadcn/ui `card`, new-york style, fetched 2026-09-09. The
upstream text and its sha256 are in `./upstream/`, per
[`../ADOPTING-SHADCN.md`](../ADOPTING-SHADCN.md). What changed:

| Upstream | Here | Why |
| --- | --- | --- |
| `React.forwardRef` on every part | `ref` as a prop | React 19 |
| `CardTitle` is a `div` | A heading with a `level` prop | Findable by assistive technology |
| `CardFooter` | `CardActions` | Named for what it holds |
| `p-6` on each part, `pt-0` on the later ones | Padding and gap on the card | No per-part spacing to keep in step; any part can be omitted |
| `bg-card text-card-foreground`, `text-muted-foreground`, `rounded-xl`, `text-sm`, `space-y-1.5` | Semantic roles | One vocabulary |
| One appearance | `raised` and `flat` | Elevation is paired with a border per `FOUNDATIONS.md` |
| No declared dependencies | Same | Nothing to remove; recorded in `provenance.json` so the review is a fact |
