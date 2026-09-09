# Selection controls

`Checkbox`, `RadioGroup` with `Radio`, and `Switch`.

Interim documentation. The Fumadocs site exists since HAUX-54, but the
component pages have not been lifted into it yet, so this lives beside the
source until they are.

## Choosing between them

The difference is behavioural, not visual. Pick the one that matches what
happens, not the one that looks right in the layout.

| Use | When | Takes effect |
| --- | --- | --- |
| `Checkbox` | An independent yes or no, usually inside a form | On submit |
| `RadioGroup` | One choice from a small, visible set | On submit |
| `Switch` | A setting | Immediately, on flip |

A switch that only takes effect when a form is submitted is the common mistake.
If there is a Save button, it is a checkbox.

## Import

```tsx
import { Checkbox, Label, Radio, RadioGroup, Switch } from "@iroshandezilva/spartant";

<div className="flex items-center gap-control-gap">
  <Checkbox id="terms" />
  <Label htmlFor="terms">I agree to the terms</Label>
</div>;
```

```tsx
<RadioGroup label="Billing period" defaultValue="monthly">
  <div className="flex items-center gap-control-gap">
    <Radio id="monthly" value="monthly" />
    <Label htmlFor="monthly">Monthly</Label>
  </div>
</RadioGroup>
```

## All three are native inputs

`Checkbox` and `Radio` are `input type="checkbox"` and `type="radio"` with
`appearance-none`. `Switch` is a native checkbox carrying `role="switch"`.

Native rather than a `div` with a role, because it keeps form participation,
label activation, the indeterminate property, and the platform's keyboard
handling. Only the painting is ours. A `button` with `aria-checked` would look
identical and give up all four.

## The radio group is the browser's

`RadioGroup` renders a `fieldset` and a `legend`, and the radios share a `name`.
That single fact gives you arrow-key movement, wrapping at the ends, one tab
stop for the whole group, and an accessible name announced on entry, with no
ARIA and no key handlers.

Reimplementing that with `role="radiogroup"` and a roving tabindex is how a
radio group ends up subtly wrong on one platform. `Radio` throws outside a
group rather than silently rendering an orphan.

## API

### Checkbox

| Prop | Type | Notes |
| --- | --- | --- |
| `indeterminate` | `boolean` | Neither checked nor unchecked. A DOM property, not an attribute, so it is set through a ref. `<input indeterminate>` does nothing. |
| `onCheckedChange` | `(checked: boolean) => void` | Alongside the native `onChange`, which still fires. |
| ...rest | `input` props | Including `checked`, `defaultChecked`, `required`, `disabled`. |

### RadioGroup and Radio

| Prop | Type | Notes |
| --- | --- | --- |
| `name` | `string` | Shared, and generated when omitted. |
| `value` / `defaultValue` | `string` | Controlled and uncontrolled. |
| `onValueChange` | `(value: string) => void` | The newly selected value. |
| `label` | `string` | Rendered as the `legend`. |
| `invalid` | `boolean` | Applied to every option. |
| `Radio.value` | `string` | Required. What this option contributes. |

### Switch

Same as `Checkbox` minus `indeterminate`, which a switch cannot be.

## Inside a Field

All three read the surrounding `Field` for `id`, `aria-invalid`,
`aria-describedby`, and `disabled`, so validation messages associate the same
way they do for a text input.

## Touch targets

The visible checkbox and radio are 20px and the switch track is 24px, which is
right to look at and wrong to hit. On coarse pointers each gets a centred 44px
hit area from a pseudo-element, so the target is met without the layout paying
for it. Same technique as Button, and the floor is the shared
`size.min-target` role rather than a copy per component.

## Motion

The switch thumb travels between two positions on `duration.state-change` with
`easing.move`; the checkbox and radio fills change colour on the same duration
with `easing.state`.

The thumb moves by `background-position`, not by moving a child element, so it
is off the layout entirely and nothing around the switch can shift whatever the
timing does.

Under `prefers-reduced-motion: reduce` the duration collapses to 0ms: the thumb
jumps and the fill changes instantly. State changes never wait for the
animation.

## States

Selected, unselected, indeterminate, disabled, invalid, focus-visible, and long
labels, in light and dark. All in the `States` story.

## Tokens

Semantic: `color.primary`, `color.border`, `color.border-strong`,
`color.surface`, `color.surface.disabled`, `color.danger`,
`color.foreground.disabled`, `color.focus-ring`, `radius.control`,
`radius.pill`, `size.min-target`, `duration.state-change`, `easing.state`,
`easing.move`.

Component: `selection.box`, `selection.switch.width`, `selection.switch.height`,
`selection.switch.thumb`.

## Known limitations

- **The switch thumb is a `background-image`, not a child element.** An `input`
  cannot have children, so the thumb is a radial gradient positioned from the
  left, which is also what keeps the movement off the layout. It reads
  `color.surface` through a custom property, so it inverts with the theme; it was
  a literal `white` until a review measured it at 2.33:1 against the checked
  track in dark theme. Checkbox and Radio draw their marks as sibling elements
  instead, which they can because they need no positional animation.
- Checkbox trees and segmented controls are explicitly out of scope for
  HAUX-48.
- No card-style or button-style radio. The plain control is the primitive.

## Audit against shadcn

Compared with shadcn's `checkbox`, `radio-group` and `switch` (new-york) in HAUX-69 on six axes: visual
baseline, API clarity, accessibility behaviour, motion contract, semantic token
use, and documentation. Decision: **keep**. Native inputs measured at or above the Radix versions on every axis, including the 44px coarse-pointer target that upstream's 20x36 switch lacks.
The full comparison, with what was measured, is the
[HAUX-69 audit comment](https://linear.app/wearehaux/issue/HAUX-69/audit-existing-components-against-their-shadcn-equivalents#comment-9182c2bd).
The upstream source it was compared against, and its provenance, are in
[`./upstream/`](./upstream/provenance.json); nothing there is imported.
