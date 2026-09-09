---
name: spartant-component-builder
description: Build or review a component in the Spartant design system. Use whenever work touches packages/spartant/src/components, a Linear HAUX issue named "Build <component>", Spartant stories, semantic or component tokens, or a component's motion, accessibility, or Storybook coverage. Also use to review an existing Spartant component against the approved conventions.
---

# Building a Spartant component

Version 1.3.0. Derived from the first core slice: Button (HAUX-43), the
text-field primitives (HAUX-49), the selection controls (HAUX-48), and Dialog
(HAUX-50), with the motion scale frozen by HAUX-68.

Everything here was learned by building and measuring those four families. The
[Traps](#traps-that-cost-real-time) section is the part you cannot get anywhere
else: each entry is a defect that shipped, or nearly shipped, and the way it was
caught.

## Two modes

**Build mode** implements a component. Work top to bottom.

**Review mode** audits one that exists. Skip to [Review mode](#review-mode).

## Do not start yet

Read these first. They are authority, not background, and this skill defers to
all of them:

| Read | For |
| --- | --- |
| The Linear issue and every attached document | Acceptance criteria, which win every conflict |
| `AGENTS.md` | Source-of-truth order, boundaries, Linear workflow, stop conditions |
| `packages/spartant/src/components/INVENTORY.md` | Whether the component is in scope, and how it is meant to be built |
| `packages/spartant/src/components/API-CONVENTIONS.md` | The API rules. This skill does not repeat them |
| `packages/spartant/src/components/ADOPTING-SHADCN.md` | The source-adoption checklist. Comparable components start from shadcn, and this is how the source becomes owned |
| `apps/storybook/STORY-TEMPLATE.md` | The stories you owe, and what the suite enforces |
| `packages/spartant/src/tokens/COLOR.md` | Contrast thresholds and the required pairings. Read before touching any colour |
| `MANUAL-REVIEW.md` | The checks a machine cannot run, and **which failures block** |

**Stories may be filed per family, not per component.** Switch's stories live in
`Selection.stories.tsx` alongside Checkbox and Radio. That is deliberate, and it
has a cost worth knowing: one contract covers three components, so a state
declared for the family but implemented in only one of them passes every
automated gate. Check each control against the contract individually.

**Definition of Ready.** Do not start unless the issue names an outcome, scope,
non-goals, acceptance criteria, dependencies, automated checks, and a manual-test
requirement, and every blocker is `Done`. If a public API choice is materially
ambiguous, stop and ask. Rework across a component family costs far more than a
question.

Move the issue to `In Progress` before editing a file.

## Build order

Follow this order. It is not arbitrary: each step makes the next one cheaper,
and doing tokens after styling means rewriting the styling.

### 0. Start from shadcn where a comparable component exists

Spartant is shadcn-first and not shadcn-dependent. If the component has a
strong shadcn equivalent, fetch its registry source and start there: it is the
initial structure and visual baseline, and starting from it is faster than
starting from nothing. Skip this step only when the issue says so, or when no
comparable component exists.

Then work `ADOPTING-SHADCN.md` in full. In short: save the upstream text and
provenance, question every declared dependency and remove the unused ones,
never type props as the primitive's props, replace every shadcn token name with
a Spartant semantic role, and measure the touch target rather than trusting it.
Nothing ships until the API, tokens, styling, accessibility, motion, tests,
stories, docs, and exports are all Spartant's own. shadcn, Radix, and Base UI
never appear in public props without an explicit approval.

Worked example: the two adaptations in `src/experiments/shadcn/`. The Badge
review found an unused declared dependency and a `div` inside running text; the
Switch review found a 20x36 touch target against a 44px floor.

### 1. Decide the element

Prefer the native element, even when the shadcn source reached for a primitive
to get behaviour the platform already supplies. The Switch adaptation dropped a
Radix dependency for exactly that reason. A native `button`, `input`, `label`, `dialog`, or
`fieldset` arrives with keyboard behaviour, form participation, disabled
semantics, and focus handling that no ARIA reproduces.

Worked example: Dialog uses `<dialog>` with `showModal()`, which gives a focus
trap, top-layer stacking, `Escape`, background inertness, and focus restoration
in one call. Selection controls use native inputs with `appearance-none`, so only
the painting is ours.

Reach for ARIA when no element does the job. Adding a primitive library is a
decision issue, not a pull request.

### 2. Write the story contract first

Before any styling. The contract in `apps/storybook/src/lib/contract.ts` forces
the decisions that are expensive to retrofit: variants, sizes, states, whether it
is interactive, retriggerable, or an overlay, the motion decision, the
accessibility contract, and the manual checks.

It will not compile until you have answered all of them. That is the point.

### 3. Map the tokens

Components consume **semantic roles**, never primitives, never raw values.

Missing a role is normal and is not permission to reach past the layer. Add the
role, then:

1. Add it to `packages/spartant/src/tokens/semantic/` and the dark theme.
2. **Map it in `packages/spartant/src/styles/theme.css` under `@theme inline`.**
3. Add contrast pairings if it is a colour.
4. Run `pnpm check:tokens && pnpm check:colors`.

Step 2 is the one everybody forgets, and forgetting it is silent. See
[Traps](#traps-that-cost-real-time). `theme-mapping.test.ts` now fails the build
if you do, which is the only reason it is safe to write this down as a checklist
item rather than a warning.

**`check:colors` cannot see a colour you did not make a token.** It validates
declared pairings between semantic roles. A literal written inside a Tailwind
arbitrary value, `radial-gradient(circle, white 49%, ...)` for example, is
invisible to it. That is not a hypothetical: it is how a switch thumb shipped at
2.33:1 against its own track in dark theme. If you find yourself typing a colour
name, you have left the token layer and the safety net with it.

A **component token** is justified only when a stable requirement cannot be a
semantic role. Control heights qualify, because they carry the touch floor and
must not move when spacing changes. Anything a semantic role can express uses the
role. `size.min-target` is a semantic role precisely because four components need
the same 44px.

### 4. Implement

Follow `API-CONVENTIONS.md`. The short version: extend the native element's
props, spread the rest, merge `className` last through `cn`, forward `ref` to the
element a caller expects, variants as a plain `Record` of complete class strings,
support controlled and uncontrolled, prefer composition over configuration.

### 5. Motion

Every component records a motion purpose **or** an explicit no-motion rationale.
Neither is a default and the contract will not compile without one.

The decision, in order:

1. Does motion explain a state change, a location, continuity, or feedback? If it
   only decorates a frequently used control, do not animate it.
2. Which semantic role expresses it? Use the frozen scale below.
3. What happens on the keyboard path? It must be immediate.
4. What happens under reduced motion? Nothing, if you used tokens.
5. Can CSS do it? It could for all four families, including a modal.

**The frozen scale**, validated by HAUX-68 against real components:

| Role | Value | Use, and what proved it |
| --- | --- | --- |
| `duration.press-feedback` | 120ms | Pointer and touch press. Button |
| `duration.state-change` | 160ms | Selection, focus, validation. Field, Checkbox, Radio, Switch |
| `duration.modal-enter` | 280ms | Dialogs and large surfaces. Dialog |
| `duration.indicator-loop` | 1000ms | One turn of a looping indicator. Button spinner |
| `easing.state` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Colour and simple state |
| `easing.move` | `cubic-bezier(0.77, 0, 0.175, 1)` | Something travelling between two visible positions. Switch thumb |
| `easing.enter` | `cubic-bezier(0.23, 1, 0.32, 1)` | Entry. Dialog |
| `easing.progress` | `cubic-bezier(0, 0, 1, 1)` | Constant speed. Button spinner |
| `scale.press` | 0.97 | Press feedback |
| `scale.overlay-enter` | 0.96 | Surface entry. Never enter from `scale(0)` |

Roles still provisional because nothing has used them:
`duration.overlay-enter`, `duration.overlay-exit`, `duration.modal-exit`,
`easing.exit`, all three `distance.*`, and both springs. If you are the first to
need one, you are also the one validating it: say so in the completion report.

**Rules that are enforced, not advisory:**

- Name the properties you transition. Never `transition`, `transition-all`, or
  `transition-colors`; all three include `outline-color` and would animate the
  focus ring. `focus-immediacy.test.ts` fails the build.
- Never animate a layout property. `transform`, `opacity`, `scale`, and
  `background-position` are safe; width, height, margin, padding, and inset are
  not.
- Reduced motion needs no branch. The stylesheet collapses the duration and scale
  roles globally, so a component that used tokens is already covered. A component
  that still moves under the `ReducedMotion` story reached past a token.
- Gate hover motion behind `@media (hover: hover) and (pointer: fine)`.

### 6. Accessibility

State the contract in the story `Contract`, and make it true:

- Role from the native element.
- Accessible name, and what happens when the caller supplies none. An icon-only
  control needs `aria-label`, and the audit fails it if missing.
- Keyboard behaviour, key by key.
- Focus movement, trapping, restoration.
- What is announced when state changes.

**Ids come from `useId`** and are overridable. **Hit area is 44 by 44 CSS pixels**
for anything actionable, met as a target rather than a visual size: a centred
pseudo-element gated on `pointer: coarse`, using `max(100%, var(--spartant-size-min-target))`.
Copy it from `packages/spartant/src/components/selection/shared.ts`.

### 7. Stories

Copy `apps/storybook/src/stories/Button.stories.tsx`. The contract decides which
stories you owe and `story-contract.test.ts` fails without them.

Assert what is real. See [Traps](#traps-that-cost-real-time) for the long list of
things a `play` function cannot observe.

### 8. Documentation

A `README.md` beside the source, until Fumadocs lands in HAUX-54. Purpose, when
not to use, import, anatomy, API, states, accessibility, motion, tokens, testing,
known limitations. Write the limitations honestly; they are the most read section.

### 9. Verify

```bash
pnpm validate          # the full gate: format, lint, docs, tokens, colours,
                       # types, tests, story tests, builds, package contents
```

Then verify in a browser what the suite cannot: focus rings, hover, press,
reduced motion at the OS level, and anything a screen reader announces. Use
`MANUAL-REVIEW.md` and paste its result block into the completion comment.

Never claim a check passed unless you ran it and can show the output.

### 10. Close the issue

Post the completion report from `AGENTS.md`. Move to `Done` when nothing is
needed from Iroshan, or `Agent Done` with the `Human input required` label and an
exact request when something is.

## Traps that cost real time

Every one of these shipped or nearly shipped in the first slice.

**A Tailwind utility can generate nothing, silently.** `duration-press` fell back
to Tailwind's default 150ms instead of the token's 120ms because durations were
mapped to `--duration-*` and Tailwind reads `--transition-duration-*`. Later
`hover:bg-danger-hover` and `text-danger-text` generated no CSS at all, because
the roles were never added to `@theme inline`. Nothing errors. The class name
looks right and the element keeps its inherited value.
*Caught by:* `theme-mapping.test.ts`. *Found by:* measuring a rendered component.

**`cn` drops classes it thinks conflict, including ordinary ones.** Two separate
failures, and the second is the one to remember. `bg-[url(...)]` was ambiguous
enough to be read as a background colour, so `checked:bg-primary` was silently
removed and a checked checkbox rendered white. Worse, `text-*` is two class
groups under one prefix, and `tailwind-merge` told them apart using its built-in
t-shirt sizes only: `text-body` is not one, so it fell through to the colour
group and every `Button` lost `text-primary-foreground` to `text-body`. Labels
rendered in the inherited colour for weeks. Nothing errored, no test failed, and
axe was green.
*Fix:* `cn` now declares the Spartant theme, and `src/lib/cn.test.ts` fails if
the stylesheet gains a role `cn` does not know. If you add a theme namespace,
add it there in the same change.
*Check it yourself:* render the component and read the resulting `class`
attribute. A class you wrote that is not in the output was merged away.

**A Tailwind arbitrary value cannot contain spaces.** An inline SVG data URI tore
the class apart at the first space in `<svg xmlns=...`.
*Fix:* render marks as sibling elements, not background images.

**`getComputedStyle` returns a live object.** Reading it before and after a change
gives you the same values twice. Snapshot to strings.

**A hidden tab freezes CSS transitions part-way.** The frozen value looks
completely plausible and is serialised as `oklab(...)`. Call
`el.getAnimations().forEach((a) => a.finish())` before reading, and check
`document.visibilityState`.

**`text-transform` does not change the accessible name.** A label capitalised with
CSS reads "Small" and is named "small", and every query by name has to guess.
Write the text as it should be read.

**happy-dom implements `showModal()` without focus movement.** Focus stays on the
trigger through open and close, so a dialog's focus trap and restoration cannot be
asserted in a `play` function however correct they are. Browser check instead.

**Synthetic events never set `:hover`, `:focus-visible`, or `:active`.** They are
driven by trusted input. Asserting them fails on working code. Equally, an
assertion that passes only because the state never engaged is not a test.

**A dangling `aria-describedby` is not caught by the audit.** Pointing at an id
that does not exist announces nothing and looks deliberate. axe stayed green.
Assert it directly, as `NoDanglingDescribedBy` does.

**A literal colour escapes every colour gate.** `check:colors` validates declared
pairings between semantic roles. A colour name inside a Tailwind arbitrary value
is invisible to it, and to `theme-mapping.test.ts`, and to axe under happy-dom.
A switch thumb written as `radial-gradient(circle, white 49%, ...)` measured
2.33:1 against its own track in dark theme and passed every check in the repo.
*Caught by:* a human-shaped review measuring the rendered colours.

**The contrast gate never measures a fill against what is behind it.**
`check:colors` walks declared pairings, and every pairing is a foreground on a
background. A tint used as a fill appears in no pairing as the thing being
measured, so it is unchecked. All six soft tints shipped aliased to the same
rung of the shared lightness ladder as a surface role, measuring exactly 1.00:1
against it: same luminance, different hue, invisible to anyone not resolving
colour. Every gate stayed green.
*Caught by:* `tint-separation.test.ts`. *Found by:* measuring the fill against
both grounds while building the first component that used it.
*Generalise it:* a new colour role is unverified until something measures it
against what it will actually sit on, in both themes.

**A state declared in a shared contract may be implemented in only one
component.** `Selection.stories.tsx` covers three controls with one contract, so
`hover` could be declared, routed to a story, and implemented nowhere.
*Caught by:* checking each control against the contract separately.

**Biome's a11y rules have false positives on native elements.** `role="switch"` on
a native checkbox was flagged for missing `aria-checked`, which would be a second
source of truth that goes stale. Suppress with a written reason, and assert the
resulting semantics through the accessibility tree.

## Review mode

Audit a component against this skill and the conventions. Report every finding as
**Before, After, Why**, most severe first.

```md
### <component>: <one-line finding>

**Before**
`the code or behaviour as it is`

**After**
`the code or behaviour as it should be`

**Why**
One or two sentences. Name the rule or the standard it comes from, and the
failure it causes. "Convention" is not a why.
```

### Where the evidence is

Review is usually read-only, so you cannot run the gates. You do not need to:

- **`apps/storybook/storybook-static/assets/*.css` is the last built stylesheet
  and it is checked in.** Grep it to prove a utility generated real CSS, to read
  what a class actually resolves to, and to settle cascade order by byte offset
  when two rules collide. This is the fastest way to catch a silently dead
  utility without a browser.
- **`packages/spartant/tooling/color/oklch.js`** exports `parseOklch` and
  `contrastRatio`. Run it under Node to turn "that looks low contrast" into a
  number. Thresholds are in `COLOR.md`: 4.5:1 body text, 3:1 for any boundary or
  indicator that carries state.
- **`MANUAL-REVIEW.md`** says which failures block. Hit area, keyboard, focus,
  screen reader and reduced motion block; disabled is exempt from blocking but
  still has to be legible.

### The checks

Each points back at the build-mode section it compresses.

1. **Semantics** ([step 1](#1-decide-the-element)). Native element? Role, name,
   keyboard, focus, announcements.
2. **Tokens** ([step 3](#3-map-the-tokens), `COLOR.md`). Any raw value or
   primitive? Any role with no `@theme inline` mapping? **Any colour literal
   inside an arbitrary value, which `check:colors` cannot see?** Measure, do not
   read the class list.
3. **Motion** ([step 5](#5-motion)). Purpose or rationale recorded? Values match
   the frozen scale? Named transition properties? Any layout property animated?
   Reduced motion via tokens rather than a branch?
4. **Hit area** ([step 6](#6-accessibility), `MANUAL-REVIEW.md` `P3`, blocking).
   44 by 44 on coarse pointers.
5. **API** ([step 4](#4-implement), `API-CONVENTIONS.md`). Native props extended,
   `className` last, **ref forwarded**, controlled and uncontrolled supported.
6. **Stories** ([step 7](#7-stories), `STORY-TEMPLATE.md`). Contract complete,
   required stories present, assertions that can actually fail. In a family
   file, check each component against the shared contract separately.
7. **Docs** ([step 8](#8-documentation)). README matches the implementation, and
   the limitations describe what is true now rather than what used to be.

A finding you cannot demonstrate is a suggestion. Say which it is.

### What to do with the output

A review is not finished when the findings are written.

- Post it as a comment on the component's Linear issue, even a closed one. That
  is where the next person looks.
- A defect that ships to a consumer, anything failing a contrast threshold or a
  blocking manual check, is a new issue, not a note.
- A stale document is a fix, not a finding. Correct it while you are there.
- If the review found something the skill should have prevented, add it to
  [Traps](#traps-that-cost-real-time). That is how this file earns its keep.

## Worked examples

| Pattern | Read |
| --- | --- |
| Variants, sizes, loading that keeps focus, hit area | `components/button/Button.tsx` |
| Composition, generated ids, described-by registration | `components/field/Field.tsx` |
| Native inputs styled with `appearance-none`, peer-revealed marks | `components/selection/Checkbox.tsx` |
| Native `dialog`, top layer, focus restoration, coordinated timing | `components/dialog/Dialog.tsx` |
| The story template applied in full | `apps/storybook/src/stories/Button.stories.tsx` |
| A contract with a no-motion rationale | any `Contract` story |

## Changelog

- **1.3.0** Direction update: Spartant is shadcn-first for comparable
  components and never shadcn-dependent. Added build step 0, the adoption
  checklist to the required reading, and the native-element caveat for source
  that reached for a primitive.
- **1.2.0** Corrections from building Badge (HAUX-45), the first component built
  with this skill in hand. Broadened the `tailwind-merge` trap after it turned
  out to affect ordinary theme classes and not only arbitrary values, added the
  trap that the contrast gate never measures a fill against its ground, and
  fixed a stale version line in the body.
- **1.1.0** Corrections from the fresh-agent test in HAUX-67. Added `COLOR.md`
  and `MANUAL-REVIEW.md` to the required reading, the per-family story caveat,
  where to find evidence during a read-only review, what to do with a review's
  output, back-references from each review check to the build step it
  compresses, and two traps the test surfaced.
- **1.0.0** Created by HAUX-67 from the first core slice and the frozen motion
  scale.
