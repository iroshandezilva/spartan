# Tooltip

Brief supplemental text for a control, on the Popover API and CSS anchor
positioning.

Interim documentation. `apps/docs` is still a placeholder, so this lives beside
the source. HAUX-54 lifts it into Fumadocs.

## Why the platform and not a primitive

HAUX-53 owned the decision the inventory deferred: primitive library or
platform. The answer is platform, and the evidence is support data measured
against what this repository already relies on.

| Feature | Chrome | Safari | Firefox | Used for |
| --- | --- | --- | --- | --- |
| Native `dialog` with `showModal()` | 37 | 15.4 | 98 | Dialog, already shipped |
| `@starting-style` | 117 | 17.5 | 129 | Dialog entry, already shipped |
| Popover API | 114 | 17 | 125 | Top layer, light dismiss, Escape |
| CSS anchor positioning | 125 | 26 | 147 | Placement and collision handling |

The Popover API is older than the `@starting-style` Dialog depends on. Anchor
positioning is the newer of the two, and it is in every current stable
browser. In a browser without it, which today means Safari before 26 and
Firefox before 147, the tooltip still opens in the top layer; it sits where the
user-agent stylesheet puts an unanchored popover, centred in the viewport,
rather than beside its trigger. That is degraded, not broken, and it is the
documented limitation rather than a reason to ship a positioning engine that no
current browser needs.

Both shadcn entries wrap Radix and contribute a class string. The snapshots and
provenance are in `upstream/`, and `Tooltip.test.tsx` asserts both that
upstream reaches for the primitive and that this component does not.

## Import

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@iroshandezilva/spartant";

<Tooltip>
  <TooltipTrigger aria-label="Bold">
    <BoldIcon />
  </TooltipTrigger>
  <TooltipContent>Bold Cmd+B</TooltipContent>
</Tooltip>;
```

## Never the only source of the information

A tooltip is a description, not a name, and it is invisible to anyone who
cannot hover. Three consequences:

- **The trigger has its own accessible name.** An icon-only trigger needs
  `aria-label`. The tooltip is linked as the trigger's description through
  `aria-describedby`, always, whether open or closed, so a screen reader
  announces it on focus even when it never opens visually.
- **The tooltip holds no interactive content.** It is `role="tooltip"`, the
  pointer passes straight through it, and focus never enters it. Anything a
  user needs to click belongs in a Popover.
- **Touch users may never see it.** Touch cannot hover, and long-press is not a
  reliable hover either, so it is not implemented. A touch user gets the tooltip
  when the trigger receives focus, which a tapped button does on Android and
  does not on iOS. Whatever the tooltip says must also be available another
  way: as the control's name, as text on the page, or as a Popover.

## Anatomy

| Part | Element | Notes |
| --- | --- | --- |
| `Tooltip` | none | Holds state, ids, and the delay timer. Renders no DOM. |
| `TooltipTrigger` | `button` | The described control. Must carry its own name. |
| `TooltipContent` | `div` | `role="tooltip"`, `popover="manual"`. |

## API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `Tooltip.open` / `defaultOpen` | `boolean` | `false` | Controlled and uncontrolled. |
| `Tooltip.onOpenChange` | `(open: boolean) => void` | | Called once per change, from any path. |
| `Tooltip.delay` | `number` | `500` | Milliseconds a pointer rests before it opens. Focus ignores it. |
| `TooltipContent.placement` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | The preferred side. The browser flips it when there is no room. |
| `TooltipTrigger.disabled` | `boolean` | | Translated to `aria-disabled`; see below. |

Every part extends its native element's props and forwards `ref`.

## When it opens and closes

| Input | Opens | Closes |
| --- | --- | --- |
| Mouse or pen | After `delay` resting on the trigger | Leaving the trigger, or pressing it |
| Keyboard | Immediately on focus | Escape, from anywhere on the page, or blur |
| Touch | On focus, where the platform focuses a tapped button | Blur |

**Sequential tooltips skip the delay and the animation.** Once one tooltip has
closed, another that opens within 300ms opens at once, marked `data-instant`,
which switches its transition off. Sweeping across a toolbar shows each label
as the pointer reaches it rather than half a second later. The window is a
property of the page, so it is tracked at module level rather than through a
provider that would have to wrap every toolbar.

**A press dismisses.** Clicking a trigger is activation, and the tooltip gets
out of the way. The focus the click causes is deliberately ignored, or the
tooltip would reopen in the same instant on the keyboard path's rules. A touch
press is not ignored, because it is the only route a touch user has.

**The delay is not motion.** Reduced motion collapses the animation and leaves
the delay alone: a tooltip that opened the instant a pointer crossed a toolbar
would be worse, not calmer.

**Nothing fires in a hidden tab.** A delay timer that elapses while the page is
hidden does not open the tooltip, per the motion standard's timed-state rule.

## Disabled triggers

`disabled` on `TooltipTrigger` does not disable the button natively. A
natively disabled button cannot be focused and does not reliably receive
pointer events, so its tooltip could never open, and explaining why a control
is unavailable is the most common reason to put a tooltip on one.

Instead the trigger stays focusable, carries `aria-disabled="true"` and
`data-disabled`, and swallows activation, including Enter and Space. It is the
same treatment `Button` gives its loading state, and for the same reason. Style
it through `aria-disabled:` variants.

## Positioning

`TooltipTrigger` sets an `anchor-name` and `TooltipContent` a matching
`position-anchor`, both generated from `useId`. Placement is `position-area`
and collision handling is `position-try-fallbacks`: flip to the opposite side
first, then slide so the surface hangs off one edge of the trigger. The browser
re-evaluates it on every scroll and resize, with no listener, no measuring, and
no portal, because the top layer already paints above everything.

The transform origin follows `data-side`, which is the side the surface
actually landed on, read back after the browser resolved the fallbacks. A
flipped tooltip still grows from its trigger.

## Motion

Fast timing, because a tooltip is glanced at. Entry on `duration.state-change`
with `easing.enter` from `scale.overlay-enter`; exit on
`duration.press-feedback` with `easing.exit`. Both roles alias the fast and
press steps the motion standard names for tooltips, and the exit is 25 percent
faster than the entry. There is no tooltip-specific duration role; if the
naming ever matters more than the values, that is a token decision, not a
component one.

Entry uses `@starting-style`; exit uses `transition-behavior: allow-discrete`
on `display` and `overlay`, so the surface stays painted for the length of the
exit and then leaves the top layer. No JavaScript is involved in either.

Under `prefers-reduced-motion: reduce` the durations collapse to 0ms and the
scale to 1, through the global token override. The component has no branch.

## Tokens

Semantic: `color.foreground` as the surface and `color.foreground.inverse` as
the ink, `radius.control`, `elevation.overlay`, `font.size.body-small`,
`font.line-height.body`, `space.control-gap` as the distance from the trigger,
`duration.state-change`, `duration.press-feedback`, `easing.enter`,
`easing.exit`, `scale.overlay-enter`.

Component: `tooltip.padding-x`, `tooltip.padding-y`, `tooltip.max-width`. The
inset is here because nothing semantic means the inset of a caption-scale
surface; the justification is in `tooltip.tokens.json`.

## Testing

`Tooltip.test.tsx` proves the delay and its cancellation with fake timers, the
sequential window on both sides of its boundary, the touch exclusion, the
hidden-tab guard, focus and blur, Escape from the document, the press-then-focus
rule, the disabled translation, the description link, controlled and
uncontrolled behaviour, ref forwarding, that `cn` kept every class, and that
the adaptation stayed adapted.

Story `play` functions prove the same paths through real user events, with the
story's own delay straddled by assertions rather than timed.

**What is not asserted:** `:hover` and `:focus-visible` styling, because
synthetic events do not set them; the top layer, light dismiss, and anchor
positioning, because happy-dom implements none of them. Where the Popover API
is missing the component falls back to the `hidden` attribute, which is what
the tests observe. The platform behaviour is the manual check.

## Known limitations

- **`TooltipTrigger` renders its own button.** It cannot wrap a `Button` or any
  other element, which follows the Dialog precedent and avoids a slot API that
  would be a decision issue. Style it with the same classes; the stories show
  how. A `render` or `asChild` escape hatch is a follow-up decision.
- **No long-press on touch.** See above. The tooltip is supplemental by
  contract, so nothing depends on it.
- **Browsers without anchor positioning centre the tooltip in the viewport.**
  Safari before 26, Firefox before 147.
- **A tooltip inside a scrolling container that clips does not clip**, because
  it is in the top layer. It also does not close on scroll, so a trigger
  scrolled out of view leaves its tooltip anchored off-screen until the pointer
  leaves. Closing on scroll is a follow-up if it proves to matter.
