# Dialog

A modal task, on the native `dialog` element.

Interim documentation. The Fumadocs site exists since HAUX-54, but the
component pages have not been lifted into it yet, so this lives beside the
source until they are.

## Why the native element

HAUX-44 approved building on `<dialog>` with `showModal()` rather than a
primitive library. One call gives:

- a focus trap,
- top layer stacking above every `z-index`, so no portal is needed,
- `Escape` dismissal,
- inertness of everything behind it,
- focus restoration to whatever opened it.

Those five are exactly where hand-built dialogs go wrong. Spartant owns what
the platform leaves open: the backdrop and surface styling from tokens, their
coordinated timing, the page scroll lock, and making sure the exit never
delays focus coming back.

## Import

```tsx
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger,
} from "@iroshandezilva/spartant";

<Dialog>
  <DialogTrigger>Delete workspace</DialogTrigger>
  <DialogContent>
    <DialogTitle>Delete this workspace?</DialogTitle>
    <DialogDescription>This cannot be undone.</DialogDescription>
    <DialogClose>Cancel</DialogClose>
  </DialogContent>
</Dialog>;
```

## Anatomy

| Part | Element | Notes |
| --- | --- | --- |
| `Dialog` | none | Holds state and ids. Renders no DOM. |
| `DialogTrigger` | `button` | Opens it. |
| `DialogContent` | `dialog` | The surface and backdrop. |
| `DialogTitle` | `h2` | **Required.** The accessible name. |
| `DialogDescription` | `p` | Optional. Announced after the name. |
| `DialogClose` | `button` | Dismisses. |

`DialogTitle` is required, not merely recommended. An unnamed modal announces
that something has taken over the page and not what it is.

## API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `Dialog.open` / `defaultOpen` | `boolean` | `false` | Controlled and uncontrolled. |
| `Dialog.onOpenChange` | `(open: boolean) => void` | | Called from every dismissal path. |
| `DialogContent.dismissOnOutsideClick` | `boolean` | `true` | Turn off for a dialog holding unsaved work. |

Every part extends its native element's props.

## No portal

`showModal()` promotes the element to the top layer, so it paints above
everything regardless of where it sits in the tree or what `overflow` and
`z-index` its ancestors have. A portal solves a problem the top layer already
solved, and costs a second tree to reason about.

## The exit is instant, on purpose

`close()` is called the moment the state goes false, without waiting for an exit
animation. The motion standard is explicit that focus must never wait for
motion, and `close()` is what restores focus to the trigger. Holding it back to
let a transition finish strands a keyboard user for the length of the animation.

The entry animates; the exit does not. That asymmetry is deliberate and is the
honest reading of the rule.

## Page scroll is locked while open

`showModal()` makes the page inert, but inert does not make the viewport
unscrollable. Measured in Chrome during the HAUX-69 audit: with a modal dialog
open, the root's computed `overflow` was still `visible` and nothing else held
the page, so a wheel or trackpad over the backdrop could scroll the document
behind the dialog. That was the one thing shadcn's Radix-based Dialog did that
this one did not. `DialogContent` now sets `overflow: hidden` on the root
element while open, adds the width of the scrollbar that disappears as padding
so the page does not shift sideways, and restores both to exactly what they
were on close or unmount. Measured after the change: `overflow: hidden` while
open, and both values restored on Escape and on a backdrop click. The wheel
itself is a manual check, because browser automation cannot produce a trusted
wheel event.

## Backdrop clicks

The backdrop belongs to the dialog element, so a click on it targets the dialog
itself rather than any child. Comparing `event.target` to the element is the
whole test.

That is why the padding lives on an inner wrapper: padding on the `dialog` would
make its box larger than the visible surface, and a click in that margin would
dismiss even though it looks like a click on the dialog.

## Motion

Surface and backdrop fade and scale in together on `duration.modal-enter` with
`easing.enter`, from `scale.overlay-enter`. Centre origin, which is what
distinguishes a dialog from a popover.

Both run one duration and one easing, so neither lands first. Under
`prefers-reduced-motion: reduce` the duration collapses to 0ms and the entry
scale to 1, and the dialog simply appears.

Entry uses `@starting-style` with `transition-behavior: allow-discrete`, so no
JavaScript is involved in the animation at all.

## Tokens

Semantic: `color.surface`, `color.border`, `color.foreground`,
`color.foreground.muted`, `radius.surface`, `elevation.modal`,
`space.surface-padding`, `space.stack-gap`, `duration.modal-enter`,
`easing.enter`, `scale.overlay-enter`.

Component: `dialog.backdrop`, `dialog.max-width`.

`dialog.backdrop` is the **only translucent colour in the system**, and the one
documented exception to the opaque rule in `COLOR.md`. Every other colour is
opaque so its contrast can be asserted against a single number; a backdrop has
nothing behind it worth asserting against.

## Testing

Story `play` functions prove the open state, the accessible name and
description, that `aria-describedby` is only set when a description exists,
every dismissal path syncing state, rapid open and close settling correctly, and
that a part outside its `Dialog` throws with a message naming both.

**Focus is not asserted in a play function.** happy-dom implements `showModal()`
without focus movement: measured with a bare `<dialog>`, focus stayed on the
trigger through both open and close. Asserting it would fail on code that is
correct in every browser. Verified in Chrome instead, where opening moves focus
into the surface and closing restores it to the trigger.

## Known limitations

- **Nested dialogs are out of scope** for HAUX-50, and the top layer stacks them
  in ways that need their own decision.
- The exit is not animated, for the focus reason above.
- Scrolling inside the dialog is the caller's: pass `max-h-*` and
  `overflow-auto` to `DialogContent`, as the long-content story does. A default
  would be wrong for short dialogs.
- The scroll lock is `overflow: hidden` on the root, which is what every
  desktop browser honours. iOS Safari has historically let the page
  rubber-band behind an `overflow: hidden` root when a touch starts on the
  backdrop; that needs touch handling of its own and is not measured here.
  A consumer with `scrollbar-gutter: stable` on the root will see the gutter
  compensated twice while a dialog is open.

## Audit against shadcn

Compared with shadcn's `dialog` (new-york) in HAUX-69 on six axes: visual
baseline, API clarity, accessibility behaviour, motion contract, semantic token
use, and documentation. Decision: **keep, with one refactor**. The page scroll lock above is the one thing the Radix version had that this one did not. Everything else, including focus entry, trapping, restoration and the entry motion, measured at or above upstream.
The full comparison, with what was measured, is the
[HAUX-69 audit comment](https://linear.app/wearehaux/issue/HAUX-69/audit-existing-components-against-their-shadcn-equivalents#comment-9182c2bd).
The upstream source it was compared against, and its provenance, are in
[`./upstream/`](./upstream/provenance.json); nothing there is imported.
