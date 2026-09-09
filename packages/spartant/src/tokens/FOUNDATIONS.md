# Typography, spacing, radius, elevation, and motion

Decided in HAUX-34. The non-colour foundations.

**Motion values are frozen where a component validated them**, and still
provisional where none has. HAUX-68 made that split against the first core
component slice; see the Motion section below for which is which.

Every scale is deliberately short. A scale with an option for every situation
stops being a decision and becomes a menu.

## Typography

Primitives are a modular scale; roles are what components use.

| Role | Primitive | Size | Use |
| --- | --- | --- | --- |
| `font.size.caption` | `xs` | 12px | Metadata, timestamps |
| `font.size.body-small` | `sm` | 14px | Dense UI, table cells |
| `font.size.body` | `md` | 16px | Default reading size |
| `font.size.body-large` | `lg` | 18px | Lead paragraphs |
| `font.size.heading-small` | `xl` | 20px | Card and section titles |
| `font.size.heading` | `2xl` | 24px | Page sections |
| `font.size.heading-large` | `3xl` | 30px | Page titles |
| `font.size.display` | `4xl` | 36px | Marketing and empty states |

16px is the body size and is not negotiable downward. It is the browser default,
and shrinking it to fit more in is the most common way an interface becomes
tiring to read.

### Line height and tracking

| Role | Value | Why |
| --- | --- | --- |
| `font.line-height.body` | 1.5 | Comfortable for multi-line reading |
| `font.line-height.heading` | 1.2 | Headings are short; 1.5 makes them look disconnected |
| `font.line-height.caption` | 1.35 | Between the two |
| `font.tracking.body` | 0 | Body text needs no adjustment |
| `font.tracking.heading` | -0.02em | Large type looks loose at default tracking |

Line height moves **down** as size goes up. Tracking moves down with it, for the
same reason: both defaults are tuned for body copy and both look wrong at 30px.

### Weight

`regular` 400 for body, `medium` 500 for emphasis within UI, `semibold` 600 for
headings. `bold` 700 exists as a primitive but has no semantic role yet, because
nothing has needed it and an unused role invites arbitrary use.

## Spacing

A 4px base, with the odd steps a design system never reaches for left out.

`0` · `px` · `1` (4px) · `2` (8px) · `3` (12px) · `4` (16px) · `5` (20px) · `6` (24px) · `8` (32px) · `10` (40px) · `12` (48px) · `16` (64px)

| Role | Value |
| --- | --- |
| `space.control-padding-x` | 16px |
| `space.control-padding-y` | 8px |
| `space.control-gap` | 8px |
| `space.surface-padding` | 24px |
| `space.stack-gap` | 16px |
| `space.section-gap` | 48px |

These cover the MVP set: a button is `control-padding`, a card is
`surface-padding`, a form is `stack-gap`, a page is `section-gap`.

## Radius

`none` · `sm` 4px · `md` 8px · `lg` 12px · `xl` 16px · `full`

| Role | Primitive | Use |
| --- | --- | --- |
| `radius.control` | `md` | Buttons, inputs, selects |
| `radius.surface` | `lg` | Cards, dialogs, popovers |
| `radius.pill` | `full` | Badges, tags, avatars |

Containers are rounder than the controls inside them. The reverse reads as a
mistake, because a sharp control inside a round card looks like it escaped.

## Elevation

| Role | Shadow | Paired with |
| --- | --- | --- |
| `elevation.flat` | none | `border` on `surface` |
| `elevation.surface` | y1 blur2 at 6% | `border.subtle` on `surface` |
| `elevation.overlay` | y4 blur8 at 10% | `border` on `surface.elevated` |
| `elevation.modal` | y12 blur24 at 14% | `border` on `surface.elevated` |

**Elevation is always paired with a border and a background**, never used alone.
In dark themes a shadow against a dark surface is nearly invisible, so a raised
element that relies only on shadow disappears. In light, `surface` is already
pure white and `surface.elevated` cannot be lighter, so the shadow is what does
the separating. Each theme leans on a different cue, and using both means
neither has to work alone. See [`THEMES.md`](./THEMES.md).

Shadow colour is the neutral ink colour at low alpha, not black. Black shadows
grey out the hue underneath them.

## Motion

Values follow the
[Motion and Micro-interaction Standard](https://linear.app/wearehaux/document/motion-and-micro-interaction-standard-eb147fee1419).

### Frozen, and what froze each

HAUX-68 validated these against Button, the text-field primitives, the selection
controls, and Dialog. Every value was measured on a rendered component, not
agreed in the abstract, and `foundations.test.ts` pins each one so a change is a
deliberate edit rather than a drift.

| Role | Value | Validated by |
| --- | --- | --- |
| `duration.press-feedback` | 120ms | Button press |
| `duration.state-change` | 160ms | Field focus and validation, Checkbox, Radio, Switch |
| `duration.modal-enter` | 280ms | Dialog entry |
| `duration.indicator-loop` | 1000ms | Button loading spinner |
| `duration.reduced` | 0ms | The reduced-motion collapse |
| `easing.state` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Button, Field, Checkbox, Radio |
| `easing.move` | `cubic-bezier(0.77, 0, 0.175, 1)` | Switch thumb |
| `easing.enter` | `cubic-bezier(0.23, 1, 0.32, 1)` | Dialog entry |
| `easing.progress` | `cubic-bezier(0, 0, 1, 1)` | Button loading spinner |
| `scale.press` | 0.97 | Button press |
| `scale.overlay-enter` | 0.96 | Dialog entry |
| `scale.reduced` | 1 | The reduced-motion collapse |

Not one value changed. The provisional scale survived contact with four
component families, which is the outcome worth recording: the numbers were
right, and now they are held down.

### Still provisional, and why

A value nothing has exercised has not been validated by anything, so calling it
frozen would be a fiction. Each of these has a named consumer that does not
exist yet, or a design decision that removed its consumer.

| Role | Why there is no evidence |
| --- | --- |
| `duration.overlay-enter`, `duration.overlay-exit` | No overlay component yet. Popover and Tooltip are HAUX-53, Select is HAUX-52. |
| `duration.modal-exit`, `easing.exit` | Dialog closes instantly so focus is never delayed, so nothing consumes an exit duration or an exit curve. |
| `distance.indicator`, `distance.state`, `distance.overlay` | No component moves anything spatially. The slice used scale and colour throughout. |
| `spring.state`, `spring.gesture` | No component needed spring physics. CSS covered every interaction in the slice, including a modal. |

`foundations.test.ts` keeps both lists honest: a new motion role in neither one
fails the build rather than sitting unclassified.

### The exits are the interesting gap

Three of the nine unevidenced roles are about leaving: `duration.overlay-exit`,
`duration.modal-exit`, and `easing.exit`. That is not an oversight, it is a
consequence. Dialog calls `close()` the moment its state goes false, because
`close()` is what restores focus and the standard says focus must never wait for
motion. An exit animation would have to gate that call, so there is no exit
animation and no consumer for an exit token.

The rule that exit should be 15 to 25 percent faster than entry still holds as a
relationship between the values, and a test still asserts it. It has simply
never been observed, and it will not be until an overlay animates out without
gating its own dismissal.

### Duration

| Role | Value | Use |
| --- | --- | --- |
| `duration.press-feedback` | 120ms | Pointer and touch press |
| `duration.state-change` | 160ms | Hover, selection, small indicators |
| `duration.overlay-enter` | 200ms | Popovers, selects, tooltips |
| `duration.overlay-exit` | 160ms | The same, leaving |
| `duration.modal-enter` | 280ms | Dialogs and large surfaces |
| `duration.modal-exit` | 200ms | The same, leaving |
| `duration.reduced` | 0ms | Everything, under reduced motion |

**Exit is faster than entry**, by roughly 20 percent. Entering is informative and
worth watching; leaving is in the way. All product motion stays at or below
300ms, asserted by test.

### Easing

| Role | Curve | Use |
| --- | --- | --- |
| `easing.enter` | `out` | Anything arriving |
| `easing.exit` | `out` | Anything leaving |
| `easing.move` | `in-out` | Moving between two visible positions |
| `easing.state` | `standard` | Colour and simple state |
| `easing.progress` | `linear` | Time and progress only |

**No `ease-in` for product UI**, asserted by test. An ease-in start feels
unresponsive, because the first frames barely move.

### Springs

Typed tokens, not custom properties. CSS has no spring primitive, so a spring in
a stylesheet could only be a string nothing reads.

| Role | Stiffness | Damping | Mass | Character |
| --- | --- | --- | --- | --- |
| `spring.state` | 420 | 36 | 1 | Settles fast, essentially no overshoot |
| `spring.gesture` | 260 | 24 | 1 | Slight overshoot, longer settle |

`state` sits at or beyond critical damping, so state that should feel immediate
does not wobble. `gesture` sits below it deliberately: the overshoot is what
reads as physicality when a user has been dragging something. Both are asserted
against their damping ratio by test.

They are exported from the package as `springs`, typed as `SpringToken`. They
are values waiting for a consumer, not a dependency: adopting Motion for React
still needs its own justification issue.

### Distance and scale

| Role | Value | Use |
| --- | --- | --- |
| `distance.indicator` | 2px | Icon and indicator nudges |
| `distance.state` | 4px | Small state movement |
| `distance.overlay` | 8px | Surfaces entering from their trigger |
| `scale.press` | 0.97 | Press feedback |
| `scale.overlay-enter` | 0.96 | Surfaces entering |
| `scale.reduced` | 1 | Under reduced motion |

**Never enter from `scale(0)`**, asserted by test. Growing from nothing reads as
a special effect rather than as a surface appearing.

### Input modality

| Input | Behaviour |
| --- | --- |
| Pointer, touch | Press feedback at `scale.press` and `duration.press-feedback` |
| Keyboard | **Immediate.** Focus and state styling only, no spatial motion |
| Programmatic | Treated as entry motion |
| Hover | Only inside `@media (hover: hover) and (pointer: fine)` |

Keyboard activation never waits for animation. A keyboard user is usually moving
faster than the animation, and making them wait is the clearest way to make an
interface feel slow.

### Interruption and rapid repeat

Use transitions rather than keyframes for anything reversible, so a new state
retargets the motion in flight instead of queueing behind it. A control clicked
twice quickly must land in the right state, not play two animations.

Timers pause while the page is hidden. Looping animation pauses off-screen.
**Theme changes do not animate**: transitioning every colour on a theme switch
produces a slow wash across the entire page.

### Reduced motion

Under `prefers-reduced-motion: reduce`, every motion token collapses in **one
place** in `../styles/theme.css`: durations to `0ms`, scales to `1`, distances
to `0px`.

This is deliberately global rather than per component. A per-component branch is
a thing a component can forget; overriding the tokens means any component that
uses them is covered whether or not its author thought about it.

Colour and opacity are left alone. A short non-spatial transition clarifies state
without moving anything, which the standard allows.

### Which tool

CSS first, always. Escalate only when the interaction genuinely needs it:

1. **CSS transitions and animations.** The default. Hover, press, focus, colour, opacity, simple enter and exit.
2. **Web Animations API.** Small imperative sequences needing playback control, without a library.
3. **Motion for React.** Interruptible state transitions, gestures, drag, springs, shared layout. Import from `motion/react`, and keep it out of components that do not need it.
4. **GSAP.** Complex multi-step timelines, advanced SVG, scroll choreography. Not a dependency of the core package.

Adding any animation dependency requires issue-level justification covering
behaviour, bundle impact, cleanup, server rendering, reduced motion, testing,
and the consumer contract. Do not add both Motion and GSAP for overlapping uses.

## Specimens

`apps/foundations` renders all of this at real size:

```bash
pnpm dev:foundations
```

Type at actual sizes with their line heights and tracking, the spacing scale,
radius and elevation samples, and working motion demos.

The motion section has two controls that exist for the review this issue
requires: **slow motion at 8x**, for watching an easing curve, and **simulate
reduced motion**. Both work by overriding the motion tokens on that subtree,
which is the same mechanism the real `prefers-reduced-motion` rule uses. A demo
that ignored them would be reaching past a token for a raw value, which is
itself worth catching.

Every value on the page is read from the published token JSON, so the specimens
cannot show something the package does not ship.

HAUX-39 builds a Storybook foundations story. When it lands, this app is a
candidate for retirement rather than something to maintain alongside it.

## Ownership

| Area | Owner |
| --- | --- |
| These foundations | HAUX-34 |
| Freezing motion values against real components | HAUX-68 |
| The taxonomy and naming grammar | HAUX-30 |
| Colour | HAUX-31 and HAUX-33 |
