# Select

One choice from a list, on the native `select`.

Interim documentation. `apps/docs` does not yet carry component pages, so this
lives beside the source. HAUX-56 lifts it into Fumadocs.

## Native, not custom: the decision

HAUX-52 owned the choice `INVENTORY.md` deferred: whether Select is a styled
native `select` or a custom listbox on an accessible primitive. The decision is
**native**, and it was made against evidence rather than preference.

The comparison was shadcn's Select, fetched from the registry and saved
verbatim in [`upstream/`](upstream/) with its provenance. It is a Radix
listbox: ten parts, a declared runtime dependency on `@radix-ui/react-select`,
an icon library, a portal, a positioning engine, scroll buttons, and every
keyboard behaviour reimplemented in JavaScript. All of that exists to buy back
what a native `select` already has.

What the native element supplies, with no dependency and no code of ours:

| Behaviour | Where it comes from |
| --- | --- |
| Arrow keys, Home and End, Page Up and Down | The platform |
| Typeahead: typing letters jumps to a matching option | The platform |
| Enter chooses, Escape closes without changing the value | The platform |
| Focus stays on the control and never has to be restored | The popup is outside the document |
| Form participation, `name`, `required`, `FormData`, reset | The element |
| A picker that works on iOS and Android | The operating system |
| The popup stays on screen in a constrained viewport | The platform repositions and scrolls it |
| `optgroup` grouping and `disabled` options | The element |

AGENTS.md says to prefer native elements when they satisfy the requirement, and
`ADOPTING-SHADCN.md` puts roving focus and typeahead in the "consider a
primitive" row only when the platform does not already give them. Here it does.
Every acceptance criterion on the issue is met by the native element, so a
primitive was not needed, and adding one would have been a dependency decision
with nothing on the other side of the scale.

### What native cannot do

These are the costs, recorded as limitations rather than as reasons to add a
dependency. Each has a trigger that would reopen the question.

- **The popup is the platform's.** Its font, colours, radius, and row height
  cannot be styled consistently across browsers. Chrome on Windows and Linux
  honours `option` colours and follows `color-scheme`; macOS and iOS ignore
  option styling entirely and show the system picker. Reopen if a prototype
  needs the list to match the design rather than the platform.
- **Options are text only.** No icons, descriptions, or rich rows. Reopen when
  a prototype needs an option that is more than a label.
- **No popup motion of ours.** The entry is the operating system's. The Motion
  and Micro-interaction Standard lists origin-aware entry as the Select
  baseline, which presumes a custom surface. The native decision makes that
  baseline inapplicable rather than unmet, and the contract records it.
- **The chevron does not rotate when the list opens.** There is no open state
  every browser exposes to CSS, and an affordance that animates in one browser
  and not another is worse than one that stays still.
- **No multi-select, no search, no async loading.** Out of scope on the issue.
  `multiple` and `size` are omitted from the props because both turn the
  element into a listbox with different behaviour.

## Import

```tsx
import { Field, FieldMessage, Label, Select } from "@iroshandezilva/spartant";

<Field required>
  <Label>Country</Label>
  <Select placeholder="Choose a country">
    <option value="gb">United Kingdom</option>
    <option value="lk">Sri Lanka</option>
  </Select>
  <FieldMessage>Where the invoice is addressed.</FieldMessage>
</Field>;
```

`Field` generates the id, points the label at the control, and lists the
messages in `aria-describedby`, exactly as it does for `Input`.

## Anatomy

| Part | Element | Role |
| --- | --- | --- |
| `Select` | `select` | The control. `ref` and `className` target it. |
| Options | `option`, `optgroup` | The caller's children, native and untouched. |
| Placeholder | `option value=""` | Rendered from the `placeholder` prop. |
| Chevron | `svg` | Decorative, `aria-hidden`, presses pass through it. |

One wrapper `span` positions the chevron over the control and carries nothing a
caller would style.

## API

Extends the native `select` props, minus `multiple` and `size`.

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `placeholder` | `string` | none | Shown while nothing is chosen. See below. |
| `value` / `defaultValue` | `string` | none | Controlled and uncontrolled, the native pairing. Uncontrolled is the default. |
| `onValueChange` | `(value: string) => void` | none | The new value. The native `onChange` still fires. |
| `children` | `option`, `optgroup` | none | Composition stays native. |
| `ref` | `Ref<HTMLSelectElement>` | none | The `select`. |

Inside a `Field`, `id`, `aria-invalid`, `aria-describedby`, `required`, and
`disabled` come from the field. An explicit prop wins over the field.

## The placeholder is an option, and the value is honest

A native `select` has no placeholder attribute. `placeholder` renders as the
first option with an empty value, and that empty value is what the control
reports and what the form submits until the user chooses. A screen reader
hears "Choose a country" as the value, which is true.

Two rules follow from `required`:

- **Required:** the placeholder option is disabled, so it cannot be chosen
  deliberately, and the empty value fails native validation. The browser blocks
  submission and reports the field as missing. Because the selected option is
  disabled, browsers omit the field from `FormData` entirely while the
  placeholder is showing: `get("country")` is `null`, not `""`. happy-dom
  reports `""`, which is why the story test accepts both.
- **Optional:** the placeholder stays selectable, so the user can return to no
  choice.

A disabled first option would normally be skipped by the browser's selection
algorithm, which would open a required select showing its first real option as
though the user had chosen it. The component pins the placeholder by supplying
an empty default value, and only when the caller has set neither `value` nor
`defaultValue`.

While the placeholder is the selection the text is `foreground.muted`, the same
colour an empty `Input` uses for its placeholder.

## Every part works alone

A bare `Select` outside a `Field` renders and stops wiring itself. Pass `id`
and a `Label htmlFor`, or `aria-label`:

```tsx
<Label htmlFor="country">Country</Label>
<Select id="country" placeholder="Choose a country">
  <option value="gb">United Kingdom</option>
</Select>
```

## Keyboard

All of it is the platform's. Spartant adds no key handler, and a test asserts
that none appears.

| Key | Behaviour |
| --- | --- |
| Tab | Moves focus to the control. Disabled is skipped. |
| Space, Enter, Alt+Down, Down | Opens the list. Which keys open it and which change the value in place is the platform's convention and differs between macOS and Windows. |
| Up, Down, Home, End | Move through the options. |
| Letters | Jump to the first option starting with them. |
| Enter | Chooses and closes. |
| Escape | Closes without changing the value. |

Focus stays on the control throughout, so there is nothing to trap or restore.

## States

Default, hover, focus-visible, disabled, invalid, empty, and long content, in
light and dark. All in the `States` story. Read-only does not exist for a
`select`; use `disabled`, or render the value as text.

Long labels are clipped with an ellipsis under the chevron rather than growing
the control. The value and the accessible label are intact; only the paint is
clipped.

## Motion

Border and background colour change on hover, focus, and on becoming invalid,
on `duration.state-change` with `easing.state`, shared with `Input` through the
same style string so the two cannot drift. Colour only: the control never moves,
and the focus ring is not transitioned.

The list has no motion of ours. Under `prefers-reduced-motion: reduce` the
duration collapses to 0ms.

## Touch target

The control is `field.height.md` tall, which is 44px, and full width. It meets
the floor the same way `Input` does, by being that size, so it needs no
extended hit area.

## Tokens

Semantic: `color.border`, `color.border.strong`, `color.danger`,
`color.surface`, `color.surface.disabled`, `color.foreground.*`,
`color.focus-ring`, `radius.control`, `duration.state-change`, `easing.state`.

Component: `field.height.md`, `field.padding-x`. Shared with the text fields
deliberately, so a select and an input in one row are the same height and
their text starts at the same inset. No select-specific token was justified:
the chevron is a 1rem glyph, and the right padding is derived from
`field.padding-x` around it.

## Testing

`Select.test.tsx` beside the source proves the decision stayed made (no
primitive, no key handler, no new dependency, no shadcn vocabulary), the
placeholder rules, controlled and uncontrolled behaviour, `Field` wiring,
`FormData` and validity, the decorative chevron, and that every class survives
`cn`.

Story `play` functions prove the label resolves to a native `select`, Tab
reaches it, choosing changes the value and calls `onValueChange`, description
and error are associated in reading order, a controlled value follows its
parent, and a form receives the value under its name and refuses the
placeholder when required.

What no test can drive: arrow keys, typeahead, Escape, and the popup itself.
happy-dom does not implement them and the popup is outside the document. They
are the manual checks in the story `Contract`.

## Known limitations

- Everything under [What native cannot do](#what-native-cannot-do).
- **The transient states cannot be screenshotted from a story.** Hover and
  focus-visible are proved by the input-path stories and the manual review, as
  for every other component.
- **`scripts/check-upstream.mjs` does not yet read this component's
  provenance.** It globs only the experiments file. The provenance here has
  the same shape so a one-line change to the script covers it; that change
  belongs to the audit issue rather than to this one.
