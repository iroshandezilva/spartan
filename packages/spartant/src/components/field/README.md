# Text fields

`Field`, `Label`, `Input`, `Textarea`, `FieldMessage`.

Interim documentation. The Fumadocs site exists since HAUX-54, but the
component pages have not been lifted into it yet, so this lives beside the
source until they are.

## When to use

Any single-line or multi-line text entry, with a label and optional help or
validation text.

## When not to use

- **A boolean.** Use Checkbox or Switch.
- **A choice from a list.** Use Radio Group or Select.

## Import

```tsx
import { Field, FieldMessage, Input, Label } from "@iroshandezilva/spartant";

<Field required>
  <Label>Email address</Label>
  <Input type="email" placeholder="you@example.com" />
  <FieldMessage>We only use this to send receipts.</FieldMessage>
</Field>;
```

`Field` generates the id, points the label at the control, and lists the
messages in `aria-describedby`. Nothing to wire.

## Anatomy

| Part | Element | Role |
| --- | --- | --- |
| `Field` | `div` | Generates ids and shares state. No role of its own. |
| `Label` | `label` | Names the control. Clicking it focuses the control. |
| `Input` | `input` | Single-line entry. `type` forwarded untouched. |
| `Textarea` | `textarea` | Multi-line entry. Resizes vertically only. |
| `FieldMessage` | `p` | Help text (`description`) or a validation error (`error`). |

## API

### Field

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `id` | `string` | generated | The control's id. Pass it when something outside points at the control. |
| `invalid` | `boolean` | `false` | Sets `aria-invalid` on the control. |
| `required` | `boolean` | `false` | Sets `required` on the control and the marker on the label. |
| `disabled` | `boolean` | `false` | Disables the control and dims the label. |

### Label, Input, Textarea, FieldMessage

Each extends its native element's props. `FieldMessage` adds
`tone: "description" | "error"`. `Label` adds `required`, which falls back to
the surrounding field so the marker and the attribute cannot disagree.

## Every part works alone

None of them throws outside a `Field`. A bare `Input` on a page is legitimate;
it simply stops wiring itself, and you own the `id` and the association:

```tsx
<Label htmlFor="email">Email address</Label>
<Input id="email" type="email" />
```

## Native types are forwarded

`type="email"`, `"number"`, `"date"`, `"search"` and the rest keep their
platform keyboards, pickers, and validation. Spartant styles the box and stays
out of the behaviour. Enhancing a native type, a masked input for example, is
its own decision and its own issue.

## Messages register themselves

`aria-describedby` names only ids that exist. A field with no messages has no
`aria-describedby` at all.

This matters more than it sounds. A reference to a missing id looks perfectly
deliberate in the markup and announces nothing, and **the accessibility audit
does not catch it**: injecting a dangling reference left every axe check green.
The `NoDanglingDescribedBy` story asserts it directly for that reason.

Order is description, then error, which is the order they are announced.

## Errors announce themselves

An error appears after the user has moved on, so `FieldMessage tone="error"` is
a polite live region. Polite rather than assertive: interrupting someone
mid-word is worse than a short wait, and a validation message is not an
emergency.

The control also carries `aria-invalid`, and the border changes colour, because
colour alone is not an accessible signal and neither is text alone.

## Read-only is not disabled

Read-only keeps focus, selection, and copying, and only looks quieter. Disabled
removes the control from the tab order entirely. Reaching for `disabled` to mean
"you cannot change this" hides the value from keyboard users who only wanted to
read it.

## States

Default, hover, focus-visible, disabled, invalid, read-only, empty, and long
content, in light and dark. All in the `States` story.

## Motion

Border and background colour change on focus and on becoming invalid, using
`duration.state-change` and `easing.state`. **Colour only.** A field must never
move while it is being typed into, and the error message is not animated at all:
validation has to be immediate.

Under `prefers-reduced-motion: reduce` the duration collapses to 0ms.

## Tokens

Semantic: `color.border`, `color.danger`, `color.danger.text`, `color.surface`,
`color.surface.muted`, `color.surface.disabled`, `color.foreground.*`,
`color.focus-ring`, `radius.control`, `space.control-padding-y` (the
textarea's vertical padding), `duration.state-change`, `easing.state`.

Component: `field.height.md`, `field.padding-x`, `field.textarea-min-height`.

`field.height.md` deliberately equals `button.height.md`, so a field and a
button line up in a row. If a shared control-height role ever appears, both
should move to it together.

## Testing

Story `play` functions prove the label resolves to the control through its
accessible name, that Tab reaches it and typing works, that description and
error are both associated in reading order with every id resolving, and that a
field with no messages has no `aria-describedby`.

## Known limitations

- **Browser autofill restyles the control.** Chrome applies its own background
  on autofill and no stylesheet fully prevents it. Listed as a manual check.
- No character counter, no floating label, no input mask. Each is a separate
  decision.
- Full form-validation library integration is explicitly out of scope for
  HAUX-49. `Field` takes `invalid` as a prop; it does not validate anything.

## Audit against shadcn

Compared with shadcn's `label`, `input`, `textarea`, `form` and `field` (new-york) in HAUX-69 on six axes: visual
baseline, API clarity, accessibility behaviour, motion contract, semantic token
use, and documentation. Decision: **keep, with one refactor**. Textarea's vertical padding moved from a raw spacing utility to the `space.control-padding-y` role, the same 0.5rem, so nothing rendered changed. Everything else measured at or above upstream, and the registration-based `aria-describedby` is stricter than shadcn's form pattern, which names a description id whether or not one is rendered.
The full comparison, with what was measured, is the
[HAUX-69 audit comment](https://linear.app/wearehaux/issue/HAUX-69/audit-existing-components-against-their-shadcn-equivalents#comment-9182c2bd).
The upstream source it was compared against, and its provenance, are in
[`./upstream/`](./upstream/provenance.json); nothing there is imported.
