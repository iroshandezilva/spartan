# Popover

Interactive content anchored to a trigger, without taking over the page.

Interim documentation. `apps/docs` is still a placeholder, so this lives beside
the source. HAUX-54 lifts it into Fumadocs.

## Why the platform and not a primitive

The decision and its evidence are recorded once, in
[`../tooltip/README.md`](../tooltip/README.md): the Popover API predates the
`@starting-style` Dialog already relies on, and CSS anchor positioning is in
every current stable browser. Popover is the component that gets the most from
it. `popover="auto"` supplies the top layer, light dismiss on outside
interaction, Escape, and focus restoration to the invoker, which are exactly
the behaviours the adoption checklist says to take from a primitive because
getting them wrong is an accessibility failure. Here they come from the
browser instead.

## Import

```tsx
import {
  Popover, PopoverClose, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger,
} from "@iroshandezilva/spartant";

<Popover>
  <PopoverTrigger>Share</PopoverTrigger>
  <PopoverContent>
    <PopoverTitle>Share this document</PopoverTitle>
    <PopoverDescription>Anyone with the link can view.</PopoverDescription>
    <Input readOnly defaultValue={link} />
    <PopoverClose>Done</PopoverClose>
  </PopoverContent>
</Popover>;
```

## Popover, Tooltip, or Dialog

| Need | Use |
| --- | --- |
| A few words about a control, nothing to click | Tooltip |
| Controls or content that belong beside a trigger, while the page stays usable | Popover |
| A task the user must finish or abandon before continuing | Dialog |

A Popover is `role="dialog"` and non-modal. The page behind it is live: Tab
leaves the surface into the page, a click on the page dismisses the popover and
lands on whatever was clicked. If that would lose the user's work, it is a
Dialog.

## Anatomy

| Part | Element | Notes |
| --- | --- | --- |
| `Popover` | none | Holds state and ids. Renders no DOM. |
| `PopoverTrigger` | `button` | The invoker, through `popovertarget`. |
| `PopoverContent` | `div` | `role="dialog"`, `popover="auto"`. The surface. |
| `PopoverTitle` | `h2` | The accessible name, through `aria-labelledby`. |
| `PopoverDescription` | `p` | Optional. Announced after the name. |
| `PopoverClose` | `button` | Dismisses. |

**Name it.** Render a `PopoverTitle`, or give `PopoverContent` an `aria-label`.
A popover with neither announces as an unnamed dialog, and the accessibility
audit fails it.

## API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `Popover.open` / `defaultOpen` | `boolean` | `false` | Controlled and uncontrolled. |
| `Popover.onOpenChange` | `(open: boolean) => void` | | Called once per change, from every path including light dismiss. |
| `PopoverContent.placement` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | The preferred side. The browser flips it when there is no room. |

Every part extends its native element's props and forwards `ref`.

## Focus

- **On open**, focus moves to the first focusable element inside, or to the
  element marked `autofocus` when there is one. A popover with nothing to focus
  leaves focus on the trigger, and Escape still reaches it there.
- **Inside**, Tab moves through the surface and then on into the page. Nothing
  is trapped, because nothing behind it is inert.
- **On close**, focus returns to the trigger unless the user already put it
  somewhere else. An outside click that lands on a field must leave focus in
  that field; a popover that yanked it back would be fighting the user.

The platform restores focus too, when focus was inside the surface at the
moment it closed. The component's own restore covers the browsers and the paths
where it does not, and the two never disagree.

## Dismissal

| Path | Owner |
| --- | --- |
| Escape, focus inside the surface | The component, and the platform. The key is consumed so it is not done twice. |
| Escape, focus on the trigger | The same. |
| Press outside the surface | The platform's light dismiss on a trusted pointer, and an owned `pointerdown` listener otherwise. Both end in the same state; the second report is deduplicated. |
| Click on the trigger while open | The platform. The trigger is the invoker, so it is exempt from light dismiss and toggles instead of dismissing and reopening. |
| `PopoverClose` | The component. |

Every path reports through `onOpenChange`, exactly once.

## One at a time

An `auto` popover light-dismisses every other `auto` popover that is not its
ancestor when it opens. Two popovers cannot be open side by side, and a story
with two `defaultOpen` popovers shows only the second. That is the platform's
stacking rule rather than a limitation of this component, and it is the right
rule for a popover: the thing the user opened last is the thing they are
looking at. Tooltips are `manual` and are exempt, which is why a toolbar can
show one while a popover is open.

## Disabled triggers

A natively `disabled` trigger cannot invoke, and that is the whole story:
unlike a Tooltip, a Popover has nothing to say about why it is unavailable.

## Positioning

The same mechanism as Tooltip: `anchor-name` on the trigger, `position-anchor`
on the surface, `position-area` for placement, `position-try-fallbacks` for
collision handling, and a transform origin that follows `data-side`, the side
the surface actually landed on. No listener, no measuring, no portal.

The surface is `popover.width` wide, clamped to the viewport, so a form inside
it is sized by the surface rather than by its longest label. Override the
width through `className`.

## Long content

The caller bounds the height and scrolls, as with Dialog: pass `max-h-*` and
`overflow-auto` to `PopoverContent`. Anchor positioning cannot rescue a surface
taller than the space on either side of its trigger.

## Motion

This is the first component whose exit animates, and it is worth saying why
that is not in tension with the rule that focus never waits for motion.
`hidePopover()` restores focus and fires its events at once; the surface merely
stays painted, out of the accessibility tree, for the length of the exit,
because `display` and `overlay` transition with `allow-discrete`. Dialog could
not do this, since `close()` removes the element from view instantly. The
Popover API keeps both transitionable, which is why `duration.overlay-exit`
and `easing.exit` finally have a consumer.

Entry on `duration.overlay-enter` with `easing.enter` from
`scale.overlay-enter`; exit on `duration.overlay-exit` with `easing.exit`, 20
percent faster. The origin is the trigger's side. There is no paired surface,
because there is no backdrop.

Under `prefers-reduced-motion: reduce` the durations collapse to 0ms and the
scale to 1, through the global token override.

## Tokens

Semantic: `color.surface.elevated`, `color.border`, `color.foreground`,
`color.foreground.muted`, `radius.surface`, `elevation.overlay`,
`font.size.body`, `font.size.body-small`, `font.size.heading-small`,
`space.control-gap` as the distance from the trigger, `duration.overlay-enter`,
`duration.overlay-exit`, `easing.enter`, `easing.exit`, `scale.overlay-enter`.

Component: `popover.width`, `popover.padding`. The justification is in
`popover.tokens.json`.

## Testing

`Popover.test.tsx` proves opening and the expanded state, the name and the
description link, focus moving in, `autofocus` precedence, focus staying on the
trigger when there is nothing to focus, Escape from both places, the close part,
outside and inside presses, focus not being stolen back, the disabled trigger,
rapid repeat, controlled and uncontrolled behaviour, ref forwarding, that `cn`
kept every class, and that the adaptation stayed adapted.

Story `play` functions prove the keyboard and pointer paths through real user
events, including focus moving in and returning, which happy-dom can observe
here because they are `element.focus()` calls rather than the native `dialog`
behaviour it lacks.

**What is not asserted:** the top layer, the platform's light dismiss, and
anchor positioning, because happy-dom implements none of them. Where the
Popover API is missing the component falls back to the `hidden` attribute and
its own outside-press listener, which is what the tests observe. The platform
behaviour is the manual check.

## Known limitations

- **`PopoverTrigger` renders its own button.** Same precedent and same
  follow-up as Tooltip.
- **`PopoverTitle` is an `h2`**, matching `DialogTitle`. A heading level that
  fits the surrounding page is a follow-up once Fumadocs has a real page to
  test it against.
- **Nested popovers are untested.** The Popover API stacks `auto` popovers
  correctly when one is rendered inside another's subtree, but no story proves
  it and DropdownMenu, which would need it, is deferred.
- **Browsers without anchor positioning centre the surface in the viewport.**
  Safari before 26, Firefox before 147. It still opens, dismisses, and manages
  focus correctly.
- **A controlled popover the platform dismisses stays dismissed** even if the
  owner ignores `onOpenChange`, until `open` next changes. Dialog has the same
  characteristic, for the same reason.
