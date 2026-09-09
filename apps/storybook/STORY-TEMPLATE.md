# Story template and state matrix

Every Spartant component story file follows one structure. This describes it.

The structure is not advice. `src/lib/contract.ts` makes the contract a
required part of the file's types, and `src/stories/story-contract.test.ts`
checks that the stories the contract implies actually exist. A file that skips
half of this does not compile, or does not pass `pnpm test`.

**Start by copying `src/stories/Button.stories.tsx`.** It is the worked
example, and every rule below is applied in it.

## The shape of a story file

```
1. The contract          const contract = { ... } satisfies StoryContract
2. The meta              satisfies Meta<typeof Component> & WithStoryContract
3. Contract              the declared contract, rendered
4. Default               the component as you would first reach for it
5. Variants / Sizes      one case per public option
6. States                the state matrix
7. DarkTheme             pinned dark
8. Composition           the component in a realistic context
9. Input paths           KeyboardPath, PointerPath, and the motion stories
```

Anything beyond that list is welcome. The list is a floor, not a ceiling.

## 1. The contract

```ts
const contract = {
  variants: ["primary", "secondary"] as const,
  sizes: [] as const,
  states: ["hover", "focus-visible", "disabled", "long-content"] as const,
  interactive: true,
  retriggerable: true,
  overlay: false,
  motion: { kind: "motion", purpose: "…", tokens: ["duration.press-feedback"], … },
  accessibility: { role: "…", name: "…", keyboard: ["…"], focus: "…" },
  manual: [{ step: "…", expect: "…" }],
} satisfies StoryContract;
```

Use `as const` on the arrays. Without it the string literals widen to `string`,
and the stories below lose the ability to iterate them type-safely.

Every field is required because every one of them is a question the component
standard and the motion standard ask before implementation. A required field is
answered. A checklist item is skipped.

`motion` is a union, so a component declares **either** a motion contract or a
no-motion rationale. There is no third option and no default. A static
component argues for its stillness in the same place a moving one would argue
for its motion, and `ContractPanel` renders that argument as the `Contract`
story — which is what "a visible no-motion rationale" means in practice.

## 2. The meta

```ts
const meta = {
  title: "Components/Thing",
  component: Thing,
  parameters: { layout: "centered", spartant: contract },
  argTypes: { … },
  args: { … },
} satisfies Meta<typeof Thing> & WithStoryContract;

export default meta;
type Story = StoryObj<typeof meta>;
```

`component` is what marks the file as a component story. The foundations
specimens omit it and are exempt from the matrix.

### Naming

| Thing | Rule |
| --- | --- |
| `title` | `Components/<Name>`. Foundations specimens use `Foundations/<Name>`. |
| Story exports | `PascalCase`, and the required ones use the exact names below. |
| A story's display name | Only override `name` for something Storybook cannot derive, such as `className override`. |

The required export names are matched literally by the contract test. A story
called `Dark` does not satisfy `DarkTheme`.

### Controls

**Controls expose only supported public props.** This needs no separate check:
`satisfies Meta<typeof Thing>` already restricts `args` and `argTypes` to the
component's own props, so a control for something that is not a public prop is
a compile error:

```
error TS2353: Object literal may only specify known properties, and
'notARealProp' does not exist in type 'Partial<ArgTypes<ThingProps>>'.
```

Beyond that:

- Give every control a `description`. It is the prop documentation consumers read.
- Derive `options` from the contract (`[...contract.variants]`) rather than retyping the list.
- Set `args` to the defaults a caller would get, so `Default` is genuinely the default.
- Do not add controls for props that only exist to drive a story.

## 3–8. The state matrix

Render matrix stories with `StateMatrix` and `StateCase` from `src/lib`. Each
case carries a label and, where it helps, a note about what was forced. A
labelled grid survives being screenshotted and linked; an unlabelled row of
components does not.

### Which states go where

| State | Where |
| --- | --- |
| `disabled`, `loading`, `selected`, `invalid`, `read-only`, `empty`, `long-content` | The `States` matrix |
| `hover`, `focus-visible`, `active` | `PointerPath` and `KeyboardPath`, which produce them for real |

The transient three are deliberately not in the matrix. Rendering them
statically would mean applying the hover styles by hand, which is to say
restating the very thing under test — the story would keep passing after the
real hover styles were deleted.

Type the matrix as a total record over the contract's states:

```ts
const staticStates: Record<
  Extract<(typeof contract.states)[number], StaticState>,
  { note: string; render: () => ReactNode }
> = { … };
```

Declaring a state and not rendering it is then a compile error rather than
something a reviewer has to spot.

### Required edge states

`empty` and `long-content` apply to almost everything and are where layout
assumptions fail. Long content belongs against real padding and a real radius,
not in a comfortably sized box.

### Dark theme

```ts
export const DarkTheme: Story = {
  parameters: { layout: "padded", themes: { themeOverride: "dark" } },
  …
};
```

`themeOverride` pins the story regardless of the toolbar, and the contract test
requires it. A `DarkTheme` story that relies on the toolbar renders in whatever
theme the reviewer last selected, so it can pass review while showing light.

Spartant's theme selector is `:root[data-theme="dark"]`, so a theme cannot be
scoped to part of a page and light-beside-dark in one story is not possible
without a second document. A pinned story plus the toolbar is the honest
alternative.

### Realistic composition

`Composition` puts the component in the context it will actually live in:
page background, neighbours, real copy, a heading above it. Components fail in
company. Spacing that reads as generous alone reads as cramped in a stack, and
a surface that looks elevated against white disappears against another surface.

## 9. Interaction tests and motion

### Where interaction tests live

**On the story whose behaviour they describe, in a `play` function.** Never in
a separate file.

```ts
export const KeyboardPath: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const thing = canvas.getByRole("button", { name: "Save" });
    await step("Tab moves focus to it", async () => {
      await userEvent.tab();
      await expect(thing).toHaveFocus();
    });
  },
};
```

`userEvent`, `within`, and `expect` come from `storybook/test`, which the
`storybook` package already provides. No extra dependency.

Keeping the assertion next to the thing asserted means they cannot drift, and a
failure names a story a reviewer can open and watch. Wrap each phase in `step`
so a failure says which phase failed.

These are not decoration. `pnpm test:stories` renders every story and awaits its
`play` function, so a broken interaction fails the build, in CI as well as
locally. Discovery is from disk: a new component's stories join the suite by
existing.

### What a play function cannot assert

`:hover`, `:focus-visible`, and `:active` are browser states driven by
*trusted* input. Events synthesised by a test are untrusted, so all three read
`false` in a play function however correct the styling is. This is measured,
not assumed: `userEvent.tab()` moves focus onto the button while
`matches(":focus-visible")` stays `false`, and a synthetic `mousedown` leaves
`matches(":active")` false with the computed scale still `none`.

So do not assert them, and be equally wary of the mirror-image mistake: an
assertion that passes only because the state never engaged is not a test, it is
a decoration. A test that fails on working code trains everyone to ignore the
suite; a test that cannot fail lets everyone ignore it safely.

The story lane runs in happy-dom, which implements enough of the platform to
render but not all of its behaviour. The native `dialog` is the sharpest case:
`showModal()` sets `open` and fires events, and does **not** move focus into the
dialog or restore it on close. Measured with a bare `<dialog>`, focus stayed on
the trigger through both. So a Dialog's focus trap and focus restoration cannot
be asserted in a `play` function either, however correct they are in every real
browser. They are browser checks and manual checks.

| Assert | Not |
| --- | --- |
| `expect(el).toHaveFocus()` | `el.matches(":focus-visible")` |
| A dialog's `open` state and accessible name | Focus moving into or out of a native `dialog` |
| The click landed and focused the control | `el.matches(":hover")` |
| The control survived and is still the same element | `getComputedStyle(el).scale` after a synthetic press |
| The state the component settles into | A duration or a frame count |

Hover appearance, the focus ring, and press motion go in `manual` instead,
which is why the contract has that field. A CSS `:active` press cannot be
verified from a play function at all, so a component whose only motion is a
press transition has a `RapidRepeat` story that proves survival and a manual
check that proves the motion.

The limit is the *test runner*, not automation in general. Input dispatched at
the browser level, as Claude's Chrome tools do, is trusted, so pressing Tab
that way does set `:focus-visible` and paints the real ring. That is measured
too. It means the focus checks in
[`MANUAL-REVIEW.md`](../../MANUAL-REVIEW.md) can be run and recorded by an
agent driving a browser, even though they can never live in a `play` function.
A screen reader remains out of reach for both.

### Required motion coverage

An interactive component exports:

| Story | Shows |
| --- | --- |
| `KeyboardPath` | Focus, activation, and that nothing waits for an animation |
| `PointerPath` | Hover and a real press and release |
| `ReducedMotion` | The same component with the motion tokens collapsed |
| `RapidRepeat` | Retrigger behaviour, when `retriggerable` |
| `OverlayOrigin` | Transform origin and paired surface timing, when `overlay` |

`ReducedMotion` is `decorators: [withReducedMotion]` and nothing else. The
decorator applies the same custom-property overrides the stylesheet's
`prefers-reduced-motion` rule applies, which is the only way to review reduced
motion without changing an operating-system setting and reloading.
`src/lib/reduced-motion.test.ts` asserts the two write the same properties, so
a story labelled "reduced motion" cannot quietly stop reducing anything.

A component that still moves under that decorator reached past a token for a
raw value. That is the finding, not a bug in the decorator.

Assert **resulting state**, not frame timing. A test that asserts an element is
enabled and not stuck mid-press after five rapid clicks stays true. A test that
asserts a duration is a flaky test with a countdown on it.

`RapidRepeat` exists because a transition and a keyframe animation behave
differently when retriggered: a transition retargets from wherever it is, an
animation queues a second play. The story is where that difference becomes
visible.

### Static components

A component with `motion: { kind: "none", … }` exports no motion stories. It
does export a `Contract` story, and that is where the rationale is visible.
Adding decorative animation to a static component instead of writing the
rationale is the failure this is shaped to prevent.

## Accessibility

Every story is audited with axe by `pnpm test:stories`, at WCAG 2.0 to 2.2 level
A and AA plus axe's best practices. There is nothing to add to a story to opt
in. The rule set lives in `src/lib/a11y.ts` and is the same object the
workbench's accessibility panel uses, so the panel cannot show a cleaner result
than the suite enforces.

Page-level rules (`region`, `page-has-heading-one`, `landmark-one-main`,
`bypass`, `html-has-lang`, `document-title`) are off. A story renders a
component into a bare canvas, not a page; those rules would fire on every story
forever, and a check that always fails is a check everyone learns to ignore.

A failure names the story, the rule, the severity, the element, and what to
change:

```
Components/Button › Contract has 1 accessibility violation(s):

  definition-list (serious) <dl> elements must only directly contain
  properly-ordered <dt> and <dd> groups, <script>, <template> or <div> elements
  https://dequeuniversity.com/rules/axe/4.13/definition-list
    at section:nth-child(3) > dl
      <dl class="grid gap-3">
      Fix all of the following:
        dl element has direct children that are not allowed: ol
```

That is a real one. It was in `ContractPanel` and the suite caught it on its
first run.

### What the suite cannot check

The story lane runs in happy-dom, which has no layout engine. Colour contrast
therefore comes back `incomplete`, not `pass`. It is covered twice over
elsewhere: the workbench's accessibility panel evaluates it against a real
layout, and `pnpm check:colors` proves the token pairings deterministically
against the documented thresholds.

Automated checks do not replace keyboard and screen-reader review for anything
complex. They catch the failures that are cheap to catch.

### Skipping a rule

```ts
parameters: {
  a11y: { disable: true, reason: "Why this story cannot be audited" },
}
```

The reason is required; the suite fails a bare `disable`. Prefer narrowing to
the one rule over disabling the story:

```ts
parameters: {
  a11y: { options: { rules: { "some-rule": { enabled: false } } } },
}
```

Per-story options are merged over the shared set rather than replacing it, so
relaxing one rule cannot silently switch off the rest.

## Accessibility notes and manual-test hooks

Both live in the contract, and both are rendered by the `Contract` story.

`accessibility` states the role, how the accessible name is produced, the
keyboard behaviour key by key, focus movement, and announcements where there
are any. It is the same contract the component's Linear issue states, in the
place a reviewer is already looking.

`manual` is either a list of `{ step, expect }` pairs or
`{ notRequired: "why" }`. The quality strategy allows manual testing to be
skipped, but only with the reason recorded where the steps would have gone. A
step without an `expect` is not a test, so the type requires both.

Manual testing is required whenever a change touches keyboard navigation, focus
movement or restoration, screen-reader announcements, pointer or touch targets,
theme appearance, responsive or long-content behaviour, or motion.

## What is checked, and by what

| Rule | Enforced by |
| --- | --- |
| The contract exists and is complete | TypeScript, at compile time |
| Controls are real public props | TypeScript, through `Meta<typeof Component>` |
| Every declared static state is rendered | TypeScript, through the total record |
| Required stories exist | `story-contract.test.ts` |
| `DarkTheme` is pinned | `story-contract.test.ts` |
| Interactive components have `play` on both input paths | `story-contract.test.ts` |
| Motion names semantic roles, not primitive steps | `story-contract.test.ts` |
| The reduced-motion story matches the stylesheet | `reduced-motion.test.ts` |
| Every story renders and its `play` completes | `pnpm test:stories` |
| Every story passes axe | `pnpm test:stories` |
| The stories build | `pnpm build:storybook`, inside `pnpm validate` |

Everything else is review.

## Related

- [Component standard](https://linear.app/wearehaux/document/mvp-components-and-component-standard-69a7f6dbd2a6)
- [Motion and micro-interaction standard](https://linear.app/wearehaux/document/motion-and-micro-interaction-standard-eb147fee1419)
- [Storybook and quality strategy](https://linear.app/wearehaux/document/storybook-and-quality-strategy-e67e1e01f6a3)
- `../../packages/spartant/src/tokens/FOUNDATIONS.md` for the motion tokens themselves
