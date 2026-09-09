# Component API conventions

The rules every Spartant component follows. Written once here so that sixteen
component issues do not each invent their own answer.

> **Status: approved** on 8 September 2026 as part of HAUX-44. Changing a rule
> here is a decision issue, not a pull request.

The test for a rule belonging here: would two reasonable people implementing two
different components disagree about it? If yes, it is decided here. If it is
obvious, it is not written down.

## Element and semantics

**Prefer the native element.** A `button` that behaves like a button costs
nothing and arrives with keyboard activation, form participation, disabled
semantics, and the platform's own focus behaviour. Reach for ARIA only when no
element does the job.

**Never take semantics away.** A component may add a role, never remove one. If
a wrapper would swallow the accessible name of what it wraps, the wrapper is
wrong.

**One element, one component.** A component renders one outer element and
forwards the rest. Anything that needs two boxes is a composition, and its parts
are exported separately.

## Props

```tsx
export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}
```

- **Extend the native element's props.** `ComponentPropsWithoutRef<"button">`,
  then add what the component itself needs. A consumer should never discover
  that `onBlur` or `aria-label` was dropped.
- **Spread the rest onto the element**, after the component's own attributes so
  a caller can override, and before nothing that would let a caller break the
  semantics.
- **`className` is merged last** through `cn`, so a caller's class wins over the
  default. This is the escape hatch, and it is the only one.
- **No `style` prop plumbing.** Callers already have `style` through the native
  props. Do not add a second styling channel.
- **Required props are rare.** If a component needs four required props, it is
  a composition wearing a trench coat.
- **No configuration objects.** `items={[...]}` is how a component becomes
  impossible to extend. Take children.

## Refs

Every component that renders a DOM element forwards its ref to that element.

React 19 passes `ref` as an ordinary prop, so `forwardRef` is not needed:

```tsx
export function Button({ ref, className, ...props }: ButtonProps) {
  return <button ref={ref} className={cn(base, className)} {...props} />;
}
```

The ref points at the element a caller would expect: the `button` for Button,
the `input` for Input, the outer surface for Card. Never at an internal wrapper.

## Variants and sizes

**Variants describe meaning, sizes describe scale.** `variant="danger"`, not
`variant="red"`. `size="sm"`, not `size="compact"`.

The convention is a plain lookup of complete class strings:

```tsx
const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
  ...
};
```

No variant library. It needs no dependency, reads top to bottom, and an agent
can extend it without learning an API. If compound variants ever become
genuinely necessary, that is a decision issue, not a quiet import.

**Every component declares its variant and size sets in its story contract**, so
the `Variants` and `Sizes` stories are generated from the same list the
component uses.

## Controlled and uncontrolled

Any component with internal state supports both:

- `value` / `defaultValue`, or `checked` / `defaultChecked`, or `open` /
  `defaultOpen`, matching the native pairing.
- `onValueChange` / `onCheckedChange` / `onOpenChange`, called with the new
  value, not the event. Native `onChange` still fires because native props pass
  through.
- Controlled when the controlling prop is not `undefined`. Do not switch modes
  on the fly, and do not warn about it at runtime; document it instead.

Document which mode a component defaults to. Uncontrolled is the default
everywhere: a prototype should not need `useState` to render a checkbox.

## Composition

A component that needs more than one box exports parts:

```tsx
<Dialog>
  <DialogTrigger />
  <DialogContent>
    <DialogTitle />
    <DialogDescription />
  </DialogContent>
</Dialog>
```

- Parts are named `<Component><Part>` and exported individually. No dot
  notation on the parent: it breaks tree shaking and confuses `import` autocomplete.
- Parts communicate through context, and the context is **not** exported. A part
  used outside its parent throws with a message naming both.
- A part is a real component with its own `className` and ref, not a slot.

## Accessibility

Stated per component in its Linear issue and its story `Contract`, and both must
agree. Every component records:

- The role, and the native element it comes from.
- How the accessible name is produced, and what happens when the caller supplies
  none.
- Keyboard behaviour, key by key.
- Focus movement, trapping, and restoration.
- What is announced when state changes.

**IDs are generated with `useId`** and can be overridden. A field that cannot
associate its label because two instances collided is the classic form bug.

**Hit area: 44 by 44 CSS pixels for anything actionable.** The visual box may be
smaller. Extend the target instead of inflating the design:

```tsx
// The control stays 32px tall; the target does not.
"relative after:absolute after:inset-0 after:-my-1.5 after:content-['']"
```

WCAG 2.2 requires 24 by 24 at AA. Spartant's floor is 44, which is the Motion and
Micro-interaction Standard's number and the right one for touch. Measured by
`P3` in [`../../../../MANUAL-REVIEW.md`](../../../../MANUAL-REVIEW.md).

## Styling

- **Semantic roles only.** `bg-primary`, never `bg-[#3b5bdb]`, never a palette
  step. If no semantic role fits, the token layer is missing one; say so rather
  than reaching past it.
- **No component tokens** unless a stable requirement genuinely cannot be
  expressed semantically, and then with the justification recorded.
- **One focus treatment.** `focus-visible:outline-2 outline-offset-2
  outline-focus-ring`, identical on every focusable component. A system with
  three focus rings has none.
- Compose with `cn`, caller's `className` last.

## Motion

Every component records a motion purpose or an explicit no-motion rationale, in
its story `Contract`. Neither is a default; the type will not compile without
one.

- **CSS first.** Transitions and animations cover hover, press, focus, colour,
  opacity, and simple enter and exit. Escalating past CSS needs issue-level
  justification.
- **Shared tokens only.** Duration, easing, distance, and scale come from the
  semantic motion roles. A raw value means reduced motion will not reach the
  component, because the reduced-motion collapse works by overriding tokens.
- **Named transition properties.** Never `transition: all`.
- **Keyboard stays immediate.** Focus, activation, announcements, and validation
  never wait for an animation.
- **Hover motion is gated** behind `@media (hover: hover) and (pointer: fine)`.
- **No layout shift.** `transform` and `opacity` only.
- **Reversible interactions use transitions**, not keyframes, so a retrigger
  retargets instead of queueing.

## Required states

Cover every state that applies, in the `States` story: default, hover,
focus-visible, active, disabled, loading, selected or checked, invalid, read
only, empty, long content, light, dark.

Declaring a state in the contract and not rendering it is a compile error. See
[`../../../../apps/storybook/STORY-TEMPLATE.md`](../../../../apps/storybook/STORY-TEMPLATE.md).

## Exports

- Every public component and its type are re-exported from `src/index.ts`.
- Internal helpers are not. A file that is not exported from the entry point is
  not public API, and a test asserts the experiments directory stays that way.
- Exports are explicit and named. No `export *`.

## Documentation

Each component ships with a Fumadocs page carrying purpose, when not to use it,
import and minimal example, anatomy, public API, variants and sizes, states,
accessibility and keyboard behaviour, token dependencies, composition examples,
testing guidance, and known limitations.

## Definition of done

A component is done when its acceptance criteria pass, its stories exist and its
contract is declared, `pnpm validate` is green, the accessibility contract is
verified, manual review is complete or explicitly not required, documentation
matches the implementation, and the package exports it.

Passing code alone is not enough. That is written in AGENTS.md and it is the
sentence most worth rereading.

## Related

- [`INVENTORY.md`](INVENTORY.md) for what is being built and what is deferred
- [`ADOPTING-SHADCN.md`](ADOPTING-SHADCN.md) for adopting outside source
- [`../tokens/README.md`](../tokens/README.md) for the token grammar
- [`../../../../apps/storybook/STORY-TEMPLATE.md`](../../../../apps/storybook/STORY-TEMPLATE.md) for the stories every component owes
