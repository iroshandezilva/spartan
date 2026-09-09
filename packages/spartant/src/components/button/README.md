# Button

The action control. A native `button`, so keyboard activation, form
participation, and disabled semantics come from the platform rather than from
us.

Interim documentation. The Fumadocs site exists since HAUX-54, but the
component pages have not been lifted into it yet, so this lives beside the
source until they are.

## When to use

Anything that performs an action: submit, delete, open, confirm, cancel.

## When not to use

- **Navigation.** Use a link. A button that navigates breaks middle-click, open
  in new tab, and the browser's own affordances, and no amount of styling
  restores them.
- **A toggle.** Use Switch for a setting that saves on flip, or Checkbox for a
  form boolean.

## Import

```tsx
import { Button } from "@iroshandezilva/spartant";

<Button onClick={save}>Save changes</Button>;
```

## API

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `"primary" \| "secondary" \| "danger" \| "ghost"` | `"primary"` | Emphasis, described by meaning. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Scale. |
| `loading` | `boolean` | `false` | Shows a progress indicator and refuses activation. Not `disabled`; see below. |
| `ref` | `Ref<HTMLButtonElement>` | | Points at the `button`. |
| ...rest | `ComponentPropsWithoutRef<"button">` | | Forwarded, including `type`, `form`, `aria-*`, and every handler. |

`type` defaults to `"button"` and can be overridden. That default is deliberate:
an unspecified button inside a form submits it, which is rarely what a prototype
means and is tedious to debug.

## Sizes

| Size | Height | Notes |
| --- | --- | --- |
| `sm` | 32px | Dense toolbars and table rows. The 44px target is restored as a centred hit area on coarse pointers. |
| `md` | 44px | Default, and meets the touch floor on its own. |
| `lg` | 52px | A primary action that should be the obvious target on a small screen. |

Heights are component tokens rather than spacing roles, so a spacing change
cannot silently shrink a control below the accessibility floor. See
`../../tokens/component/button.tokens.json`.

## Loading is not disabled

`disabled` removes an element from the tab order and drops focus. A button that
becomes disabled the moment it is pressed therefore loses the user's place at
exactly the moment they are waiting for something.

`loading` instead keeps the button focusable, marks it `aria-busy` and
`aria-disabled`, and refuses the activation. The label stays in the DOM at zero
opacity, which keeps both the accessible name and the button's width, so
starting a load does not resize the button and shove the layout around it.

The consumer's `onClick` is not called, and the default is prevented, which is
what stops a `type="submit"` button submitting. A listener attached directly to
the element with `addEventListener` will still see the event: React delegates
from the root, and a component cannot stop a listener attached to its own
element.

## Icon-only buttons

There is no text, so supply the name:

```tsx
<Button aria-label="Close" variant="ghost" className="aspect-square px-0">
  <CloseIcon aria-hidden="true" />
</Button>
```

Without `aria-label` the accessibility audit fails the story, which is the
intended outcome rather than a nuisance.

## States

Default, hover, focus-visible, active, disabled, loading, and long content, in
light and dark. All rendered in the `States`, `Variants`, and `Sizes` stories.

## Accessibility

- **Role** comes from the native element.
- **Name** is the text content, or `aria-label` when there is none.
- **Keyboard**: Tab to focus, Space and Enter to activate. A disabled button is
  skipped. A loading button keeps focus and refuses activation.
- **Focus**: a 2px `focus-visible` outline at 2px offset in the focus-ring
  colour, identical to every other focusable component.
- **Announcements**: `aria-busy` alongside `aria-disabled` while loading, so
  assistive technology reports a wait rather than a dead control.

## Motion

Press feedback on pointer and touch, and a loading indicator. Both consume
motion tokens: `duration.press-feedback`, `duration.indicator-loop`,
`easing.state`, and `scale.press`.

Under `prefers-reduced-motion: reduce` the stylesheet collapses those roles, so
the press becomes instant and the spinner stops turning. There is no branch in
the component, which is the point: it cannot forget.

The press scale applies to `:active`, which browsers also set during keyboard
activation. CSS cannot separate the two. Nothing waits for the animation, so the
keyboard path is immediate regardless.

## Tokens

Semantic: `color.primary.*`, `color.secondary.*`, `color.danger.*`,
`color.surface.muted`, `color.surface.selected`, `color.surface.disabled`,
`color.foreground.*`, `color.focus-ring`, `radius.control`, `space.control-gap`,
and the motion roles above.

Component: `button.height.*`, `button.padding-x.*`, `button.min-target`.

## Testing

Behaviour is proved by the story `play` functions, run by `pnpm test:stories`:
keyboard focus and activation, the pointer path, loading refusing activation
while keeping focus, and rapid repeat. Every story is also audited with axe.

`:hover`, `:focus-visible`, and `:active` cannot be asserted from a play
function, because synthesised events are untrusted. Those are manual checks and
the story contract lists them.

## Known limitations

- No `asChild` or polymorphic `as`. A link that looks like a button is a
  separate decision, and slot-style composition is not in the approved API.
- Button groups and split buttons are explicitly out of scope for HAUX-43.
- The loading spinner is a static ring under reduced motion. That is deliberate,
  and `aria-busy` carries the state, but it does look like a stalled indicator
  rather than an obviously reduced one. HAUX-68 can revisit it.

## Audit against shadcn

Compared with shadcn's `button` (new-york) in HAUX-69 on six axes: visual
baseline, API clarity, accessibility behaviour, motion contract, semantic token
use, and documentation. Decision: **keep**. Every axis measured at or above upstream; the `icon` size and `[&_svg]` sizing shadcn ships are public-API additions and need their own decision.
The full comparison, with what was measured, is the
[HAUX-69 audit comment](https://linear.app/wearehaux/issue/HAUX-69/audit-existing-components-against-their-shadcn-equivalents#comment-9182c2bd).
The upstream source it was compared against, and its provenance, are in
[`./upstream/`](./upstream/provenance.json); nothing there is imported.
