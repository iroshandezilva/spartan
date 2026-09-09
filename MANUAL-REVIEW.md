# Manual component review

The checks a person has to run, because a machine cannot.

`pnpm validate` already renders every story, runs its interactions, and audits
it with axe. This covers what that leaves: whether the focus ring is actually
visible, whether a screen reader says something sensible, whether motion helps
or merely happens, and whether any of it survives a real device.

Keep it short by only running what applies. The universal checks are for every
component. The component-specific ones have triggers, and a component that does
not meet a trigger skips that whole group.

## When a manual review is required

Whenever a change affects keyboard navigation, focus movement or restoration,
screen-reader announcements, pointer or touch behaviour, theme appearance,
responsive or long-content behaviour, animation, reduced motion, package
installation, or production deployment.

Otherwise write `Manual test not required` with the reason. That is a real
option, not an admission.

## Environments

Deliberately small. A solo project cannot maintain a device lab, and a
checklist that demands one gets skipped entirely.

| Environment | Used for | How |
| --- | --- | --- |
| Chrome, current stable | Everything. The primary environment. | `pnpm dev:storybook` |
| Safari, current stable | Theme, focus rings, and recent CSS. WebKit is where differences show up. | Same URL |
| macOS VoiceOver | The `S` group | `Cmd+F5` to toggle. `Ctrl+Option+Arrow` to move. |
| Reduce motion | The `D` group | System Settings, Accessibility, Display, Reduce motion. Reload after changing it. |
| A real iPhone or iPad | The `G` group only | `pnpm dev:storybook` prints a network URL. Open it on the device over the same network. |

Firefox is optional. Run it when a change touches layout or focus styling and
you want a third opinion.

The touch device is the one environment that cannot be substituted, and it is
required only when a gesture trigger applies. A desktop emulator does not
reproduce momentum, rubber-banding, or how a real finger occludes the target.

## What blocks completion

A **blocking** failure means the issue does not move to `Done`. No exceptions
by agreement, no "follow-up issue" that never gets written.

- Every failure in the `K`, `F`, `S`, and `D` groups blocks. Keyboard access,
  visible focus, announcements, and reduced motion are the contract, not
  polish.
- `P3` (touch target) blocks. It is a floor, not a preference.
- A failure in `R`, `P`, `L`, or `M` blocks when it makes the component
  unusable, unreadable, or wrong in one theme. It does not block when it is
  cosmetic and recorded.
- Any component-specific failure inside a triggered group blocks.
- A check you could not run is **not** a pass. Record it under `Not run` with
  the reason. If the reason is that you lack the environment, the issue goes to
  `Agent Done` with `Human input required`, naming the exact steps.

## Universal checks

Each step names what to do and what you should see. If you cannot tell whether
something passed, the step is badly written; fix the step.

### R. Render and theme

| ID | Do this | Expect |
| --- | --- | --- |
| R1 | Open the `Default` story in Chrome, console open. | The component renders complete, and the console is clean. |
| R2 | Switch the toolbar theme to dark, then back. | Surface, border, and text all change together. Nothing keeps a light value in dark. No flash of unstyled content. |
| R3 | Open the `Composition` story. | The component reads correctly against the page background and its neighbours. Elevation still separates it from what is behind it. |
| R4 | Repeat R1 and R2 in Safari. | Same result as Chrome. |

### K. Keyboard

| ID | Do this | Expect |
| --- | --- | --- |
| K1 | Click the canvas background, then press Tab repeatedly through the component and out the other side. | Every interactive element receives focus exactly once, in the order it appears. Nothing is skipped, nothing traps you. |
| K2 | Activate the control with Enter, then with Space, following the native element's rules. | It acts immediately. Nothing waits for an animation to finish. |
| K3 | Open the disabled case from the `States` story and Tab through it. | Focus skips the disabled control, and it cannot be activated. |

### F. Focus

`:focus-visible` is driven by *trusted* input. The synthetic events a test
runner dispatches are untrusted, so `pnpm test:stories` can never reach this
group. That is why it is here.

Browser automation is a different matter, and the distinction is worth knowing:
input dispatched at the browser level, as Claude's Chrome tools do, **is**
trusted. Pressing Tab that way sets `:focus-visible` and paints the real ring,
so an agent driving a browser can run `F1` and `F2` and record measured values.
Verified on the proof component: Tab produced `2px solid oklch(0.54 0.1862 264)`
at `2px` offset, matching `--spartant-color-focus-ring` exactly.

| ID | Do this | Expect |
| --- | --- | --- |
| F1 | Tab to each interactive element, in light and then dark theme. | A clearly visible focus indicator, offset from the control, readable against both the component surface and the page background. |
| F2 | **On a fresh page load, before pressing any key**, click the control with the mouse. Then reload and press Tab to it. | No focus ring on the click. A focus ring on the keyboard. A ring on click means the styling used `:focus` where it should use `:focus-visible`. The fresh load matters: Chrome remembers that you last used the keyboard and keeps `:focus-visible` on through a subsequent click, which reads as a failure when nothing is wrong. |
| F3 | With the browser zoomed to 200%, Tab to the control. | The focus indicator is still fully visible and not clipped. |

### S. Screen reader

VoiceOver on macOS: `Cmd+F5` to start, `Ctrl+Option+Right` to move.

Nothing automates this group, not even browser automation. It is the one most
likely to send an issue to `Agent Done` with `Human input required`.

| ID | Do this | Expect |
| --- | --- | --- |
| S1 | Navigate to the component. | The role and the name are announced, and they match the `role` and `name` in the story's `Contract`. If the contract and the announcement disagree, one of them is wrong. |
| S2 | Change a state the component supports: checked, selected, expanded, invalid, busy. | The new state is announced. Focus does not jump. |
| S3 | Where the component has help or error text, move to the field. | The text is announced with the field rather than stranded somewhere else in the reading order. |

### P. Pointer and touch

| ID | Do this | Expect |
| --- | --- | --- |
| P1 | Hover over the component with a mouse. | Hover styling appears. Nothing that matters is only available on hover. |
| P2 | Press and hold, then release. | Press feedback appears while held and returns on release. |
| P3 | Measure every actionable target with the snippet in [Measuring](#measuring), **with the DevTools device toolbar on** so the pointer is coarse. | At least 44 by 44 CSS pixels of hit area. The visual box may be smaller: a target extended for touch only exists under `pointer: coarse`, and measuring on a desktop pointer reports a false failure. |
| P4 | Press the control, drag the pointer off it, then release. | It does not activate, and the press state clears. |

### L. Layout, responsive, and long content

| ID | Do this | Expect |
| --- | --- | --- |
| L1 | Narrow the viewport to 320 px with the DevTools device toolbar or Storybook's viewport control, then confirm `document.documentElement.clientWidth` really reports 320. | No horizontal page scrolling. Nothing clipped or overlapping. Confirm the width first: resizing the browser window does not always reach the page, and constraining the story container instead does not move the media-query breakpoints, so both can quietly measure the wrong thing. |
| L2 | Open the `long-content` case in the `States` story. | Text wraps. Padding and radius still hold. Nothing is cut off. |
| L3 | Open the `empty` case. | The component still holds a sensible shape rather than collapsing. |
| L4 | Zoom the browser to 200%. | No clipping and no overlap. |

### M. Motion

Run this group when the story's `Contract` declares `kind: "motion"`. When it
declares `kind: "none"`, record `M n/a` and paste the rationale into the result
block. That is the check: a still component has to have argued for its
stillness.

| ID | Do this | Expect |
| --- | --- | --- |
| M1 | Watch the movement once at normal speed. Ask what it told you. | It explains a state change, a location, continuity, or feedback. Movement that only decorates fails, however pleasant. |
| M2 | Read the computed values with the snippet in [Measuring](#measuring). | Duration, easing, distance, and scale resolve to the semantic roles the contract names. A raw value here means the component reached past the token, and reduced motion will not reach it. |
| M3 | Time the entry and the exit. | At or below 300 ms unless the contract argues for longer. Exit is 15 to 25 percent faster than entry. |
| M4 | Check the easing role. | It matches the contract. Never an `ease-in` curve for product UI. Never `transition: all`. |
| M5 | Open an overlay from triggers in different screen positions. | Popovers and tooltips grow from their trigger. Dialogs come from the centre. |
| M6 | Watch a paired surface, such as a dialog and its backdrop. | They move together. Neither lands noticeably before the other. |
| M7 | Watch the surrounding content while the motion runs. | Nothing around the component moves. Motion uses `transform` and `opacity`, so it cannot push layout. |
| M8 | Trigger the interaction repeatedly and quickly, including part-way through the previous run. | Each trigger retargets from wherever the motion currently is. Nothing queues, nothing sticks part-way. |

### D. Reduced motion

Turn the OS setting on and reload. The `ReducedMotion` story simulates this by
collapsing the motion tokens on a subtree, which is useful day to day, but the
real setting is what ships.

| ID | Do this | Expect |
| --- | --- | --- |
| D1 | Repeat the interactions from `M`. | No movement, scaling, parallax, spring, drag momentum, or autoplay. |
| D2 | Change state. | The change is immediate. |
| D3 | Open and close anything that moves focus. | Focus placement, trapping, restoration, and announcements happen immediately and never wait for a transition. |
| D4 | Look at what remains. | A colour or opacity transition may stay if it clarifies the state and finishes within 100 ms. Nothing else. |
| D5 | Compare with the `ReducedMotion` story. | They agree. If the story is calmer than the real setting, the component reached past a token and the story is lying. |

## Component-specific checks

Run a group only when its trigger applies. Record the groups you ran.

| Trigger | Group |
| --- | --- |
| A positioned overlay: dialog, popover, tooltip, select | `O` |
| Drag, swipe, momentum, or multi-touch | `G` |
| A form control that accepts or validates input | `V` |
| Selection semantics: checkbox, radio group, switch, tabs | `C` |
| A timer, a delay, or a looping animation | `T` |

### O. Overlays

| ID | Do this | Expect |
| --- | --- | --- |
| O1 | Open it from the keyboard. | Focus moves into the surface. |
| O2 | Tab past the last element inside. | Focus wraps within the surface rather than escaping to the page. |
| O3 | Close it. | Focus returns to the trigger that opened it. |
| O4 | Press Escape. | It dismisses. |
| O5 | Click outside it, where the contract says that dismisses. | It dismisses. Where the contract says it should not, it stays. |
| O6 | Repeat O1 and O3 with reduce motion on, and again with the animation mid-flight. | Focus moves and returns immediately in every case. It never waits for the surface to finish moving. |

### G. Gestures

**Requires a real iPhone or iPad.** A desktop emulator does not reproduce
momentum, rubber-banding, or a finger covering the thing it is moving. If you
do not have the device to hand, this group is `Not run`, and the issue goes to
`Agent Done` with `Human input required`.

| ID | Do this | Expect |
| --- | --- | --- |
| G1 | Perform the gesture on the device, slowly and then quickly. | It tracks the finger, releases where you let go, and any momentum settles naturally. |
| G2 | Repeat with reduce motion on. | No momentum and no spring. The result state is still reached. |
| G3 | Perform the gesture near the screen edges and while the page can scroll. | The gesture does not capture a scroll that belongs to the page, and the page does not steal a gesture that belongs to the component. |
| G4 | Watch what your finger covers. | The state you need to see is not underneath your hand. |

### V. Form controls

| ID | Do this | Expect |
| --- | --- | --- |
| V1 | Make the field invalid. | The error is announced, and it is programmatically associated with the field rather than merely next to it. |
| V2 | Move to a field with description text. | The description is announced with the field. |
| V3 | Press Enter in a text field inside a form. | It submits, where the form expects that. |
| V4 | Compare the read-only and disabled states. | Read-only is reachable and copyable. Disabled is neither. They do not look identical. |

### C. Selection controls

| ID | Do this | Expect |
| --- | --- | --- |
| C1 | Toggle the control. | The new checked or selected state is announced. |
| C2 | Use the arrow keys within a group. | Movement follows the pattern the contract names, and the group is announced with its position and size. |

### T. Timed and looping behaviour

| ID | Do this | Expect |
| --- | --- | --- |
| T1 | Start the timed behaviour, switch to another tab, come back. | The timer paused while hidden rather than firing in the background. |
| T2 | Scroll a looping animation off screen. | It pauses. |

## Release checks

Not per component. Run these when the change touches packaging or deployment.

| ID | Do this | Expect |
| --- | --- | --- |
| I1 | `pnpm inspect:package`, then install the packed tarball into `examples/consumer` and run it. | It renders and styles correctly through the published exports, with no reach into `src`. |
| I2 | Deploy to the production URL and open it. | The page builds, renders, and its links work. |

## Measuring

Two of the steps above ask for numbers. Paste these into the browser console on
the story, so the answer is measured rather than eyeballed.

Touch targets, for `P3`:

```js
[...document.querySelectorAll('#storybook-root button, #storybook-root a, #storybook-root input, #storybook-root [role="button"]')]
  .map((el) => {
    const box = el.getBoundingClientRect();
    // A component may extend its target with a pseudo-element rather than grow.
    // Read it as a string: getComputedStyle returns a live object.
    const after = getComputedStyle(el, '::after');
    const extended = String(after.content) !== 'none';
    const w = Math.max(box.width, extended ? parseFloat(after.width) || 0 : 0);
    const h = Math.max(box.height, extended ? parseFloat(after.height) || 0 : 0);
    return {
      el: el.textContent.trim().slice(0, 24),
      box: `${Math.round(box.width)}x${Math.round(box.height)}`,
      target: `${Math.round(w)}x${Math.round(h)}`,
      ok: w >= 44 && h >= 44,
      coarse: matchMedia('(pointer: coarse)').matches,
    };
  });
```

Check `coarse` in the output before reading `ok`. If it is `false`, the device
toolbar is not on and any touch-only extension is not in play.

Motion tokens, for `M2`. Read the element that moves:

```js
const el = document.querySelector('#storybook-root button');
const cs = getComputedStyle(el);
({
  // Read this first. A hidden tab freezes transitions part-way and the frozen
  // value looks entirely plausible.
  tab: document.visibilityState,
  property: cs.transitionProperty,
  duration: cs.transitionDuration,
  easing: cs.transitionTimingFunction,
  // Compare against the roles the contract names.
  pressDuration: cs.getPropertyValue('--spartant-duration-press-feedback').trim(),
  pressScale: cs.getPropertyValue('--spartant-scale-press').trim(),
});
```

A duration that does not match any token means the component used a raw value,
or a Tailwind utility that silently generated nothing. Both have happened here.

Read computed styles in a **visible** tab. A backgrounded tab freezes CSS
transitions part-way, and the frozen value looks like a real one.

## Result block

Paste this into the Linear completion comment and the pull request. Fill in
every row. `pass`, `fail`, `n/a`, or `not run`, and nothing vaguer.

```md
### Manual review

Component: <name>
Build: <what you tested, for example `pnpm build:storybook` at <date>>
Environments: Chrome <version>, Safari <version>, macOS VoiceOver, reduce motion on and off

| Group | Result |
| --- | --- |
| R render and theme | |
| K keyboard | |
| F focus | |
| S screen reader | |
| P pointer and touch | |
| L layout and content | |
| M motion | |
| D reduced motion | |
| Component-specific | <groups run, or none apply> |

Failures: <id, what happened, blocking or not>
Not run: <id, why>
```

Write `none` on the last two lines only if you actually looked.

## Related

- [`AGENTS.md`](AGENTS.md) for the manual-test policy and the definition of done
- [`apps/storybook/STORY-TEMPLATE.md`](apps/storybook/STORY-TEMPLATE.md) for what the automated suite already covers, and what it cannot
- [`packages/spartant/src/tokens/FOUNDATIONS.md`](packages/spartant/src/tokens/FOUNDATIONS.md) for the motion tokens the `M` group compares against
- [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md) for where the result block goes
