# Tabs

`Tabs`, `TabsList`, `Tab`, and `TabsPanel`. Switching between related panels.

Interim documentation beside the source. HAUX-56 lifts it into Fumadocs.

## When to use

A small set of related views of one thing, where the user chooses which to look
at and the others stay a click away: the sections of a settings page, the
views of a record, the tabs of an inspector.

## When not to use

- **Steps in a sequence.** Tabs let the user go anywhere; a wizard should not.
- **Navigation between pages.** A tab that changes the URL is a link. Use
  links styled as a bar, or wire `value` to the router yourself; routing
  integration is out of scope for v0.1.
- **More than about seven.** Tabs scroll rather than wrap, and a scrolled tab
  is a hidden tab. Use a `Select` or a list instead.

## Import

```tsx
import { Tab, Tabs, TabsList, TabsPanel } from "@iroshandezilva/spartant";

<Tabs defaultValue="overview">
  <TabsList aria-label="Project">
    <Tab value="overview">Overview</Tab>
    <Tab value="activity">Activity</Tab>
    <Tab value="settings">Settings</Tab>
  </TabsList>
  <TabsPanel value="overview">...</TabsPanel>
  <TabsPanel value="activity">...</TabsPanel>
  <TabsPanel value="settings">...</TabsPanel>
</Tabs>;
```

Give the list an `aria-label`. The tabs name themselves, the panels are named
by their tabs, and the label is what names the group.

## Anatomy

```
Tabs                       div, layout per orientation, holds the state
  TabsList                 div role="tablist", the keyboard model and the rule
    Tab                    button role="tab", one per panel
  TabsPanel                div role="tabpanel", one per tab
```

Parts communicate through a context that is not exported. A part outside its
`Tabs` throws with a message naming both.

## Owned source, adapted from shadcn

Started from shadcn's `tabs` (snapshot and provenance in `./upstream/`) and
made Spartant's own. shadcn's version wraps `@radix-ui/react-tabs`, which
AGENTS.md does not allow without a decision issue, and which the platform makes
unnecessary here: native buttons supply focus, activation, and disabled
semantics, the ARIA roles and relationships are attributes, and the roving
tabindex is a keydown handler. The Switch adaptation reached the same verdict.

The other visible change is the indicator. shadcn marks the selected tab with a
`bg-background` pill on a `bg-muted` track. In Spartant tokens that pill
measures **1.16:1** in light and **1.15:1** in dark against its track, so it
cannot carry the selected state. A two-pixel `color.primary` underline can: it
measures 5.25:1 and 4.96:1 on the surface and page in light, 6.86:1 and 8.71:1
in dark, against a 3:1 floor for an indicator that carries state.

## API

### Tabs

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `string` | Controlled selection. |
| `defaultValue` | `string` | Uncontrolled initial selection. With neither, nothing is selected and no panel shows. |
| `onValueChange` | `(value: string) => void` | Called with the newly selected value, once per input interaction. |
| `orientation` | `"horizontal" \| "vertical"` | Which way the list runs, and which arrow keys move through it. Default `horizontal`. |
| `activation` | `"automatic" \| "manual"` | Whether focusing a tab selects it. Default `automatic`. See below. |
| `id` | `string` | Base for every generated id. Generated with `useId` when omitted. |
| ...rest | `div` props | Including `className` and `ref`, which target the root. |

### TabsList

`div` props. `className` and `ref` target the list. Give it an `aria-label`.

### Tab

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `string` | Required. What selecting this tab selects, and what names its panel. |
| `disabled` | `boolean` | Native. Skipped by the arrow keys and by Tab, and cannot be selected by click. |
| ...rest | `button` props minus `id`, `type`, `value` | `className` and `ref` target the button. |

### TabsPanel

| Prop | Type | Notes |
| --- | --- | --- |
| `value` | `string` | Required. The `Tab` this panel belongs to. |
| `keepMounted` | `boolean` | Keep the children rendered while hidden. Default `false`. See below. |
| ...rest | `div` props minus `id` | `className` and `ref` target the panel. |

### Why `Tab` and `TabsPanel` take no `id`

Ids are derived from the root's id and each part's `value`:
`<root>-tab-<value>` and `<root>-panel-<value>`. That is what lets a tab and its
panel point at each other without a registry. An `id` override on one side
would silently break `aria-controls` or `aria-labelledby` on the other, so the
override lives on `Tabs`, where it moves both sides together. Whitespace in a
value becomes a hyphen, because an id cannot hold a space.

## Activation

**Automatic** is the default and the WAI-ARIA default: a tab is selected the
moment it receives focus, so the arrow keys both move and select. Right for
panels that are cheap to show, which is most of them.

**Manual** moves focus only. Enter or Space selects the focused tab, through
the click a native button dispatches for both keys. Use it when showing a panel
is expensive or has side effects, so a keyboard user passing through the list
to reach the third tab does not load the second.

The choice is a prop rather than a behaviour hidden in the component, so a
reader of the JSX can see which one is in force.

## Controlled and uncontrolled

Uncontrolled by default. `value` makes it controlled; the mode is fixed on
first render, as it is for a native input.

`onValueChange` fires once per input interaction. A pointer click arrives as
focus and then click, and in automatic mode both would ask for the same
selection; the second is folded into the first. A controlled parent that
declines the request therefore hears it once, and hears it again on the next
click.

## Dynamic content

Tabs and panels can be added or removed at any time. The list reads the DOM
when a key is pressed, so a tab that was added a moment ago is already in the
arrow order.

If the selected tab is removed, nothing is selected: no panel shows, every tab
reports `aria-selected="false"`, and the first enabled tab takes the tab stop
so the list stays reachable. The same fallback applies when the selected tab is
disabled. Select something else to recover, or set `value` from outside.

A hidden panel keeps its element and drops its children. The element stays so
`aria-controls` always resolves; the children go so an expensive panel costs
nothing until shown. `keepMounted` keeps them, for a panel holding state that
must survive switching away, such as a half-filled form. A tab only carries
`aria-controls` once its panel has rendered, because a reference to an id that
is not in the document is an invalid ARIA value. That registration happens in
an effect, so on a static server render the attribute appears at hydration,
which is the same trade `Field` makes for `aria-describedby`.

## Keyboard

| Key | Horizontal | Vertical |
| --- | --- | --- |
| Tab | Into the list, onto the selected tab (or the first enabled tab when nothing selected can take focus). Tab again moves into the shown panel, which is focusable. | Same |
| ArrowRight / ArrowLeft | Next / previous enabled tab, wrapping | Ignored |
| ArrowDown / ArrowUp | Ignored | Next / previous enabled tab, wrapping |
| Home / End | First / last enabled tab | Same |
| Enter / Space | Selects the focused tab. In automatic mode it already is. | Same |

The list consumes the keys it handles so the page does not scroll. A caller's
own `onKeyDown` runs first and can `preventDefault()` to opt out.

## Accessibility

- `tablist` on a `div` with `aria-orientation`; `tab` on native `button`
  elements with `aria-selected` and `aria-controls`; `tabpanel` on a `div`
  with `aria-labelledby`.
- One tab stop. The selected tab holds `tabindex="0"`, every other tab `-1`,
  and the list corrects that after every render so the fallback above holds.
- Disabled is the native attribute, so it is announced, skipped, and
  unclickable rather than merely grey.
- Focus: the shared 2px `focus-visible` outline at 2px offset. The list
  carries 4px of padding so its own scroll container never clips the ring.
- Hit area: every tab is at least `size.min-target` (44px) tall, and a narrow
  tab gains a centred 44px target on coarse pointers, the same way Button does.

## Motion

Pointer selection fades the indicator and the label colour in over
`duration.state-change` with `easing.state`. The indicator is an inset box
shadow, so it paints without taking space and nothing around it moves.

The keyboard path is immediate. The list records whether the last input was a
pointer or a key (`data-source` on the tablist), and a selection that came from
a key paints its final state at once. The panel, focus, and `aria-selected`
never wait for the fade on either path.

Under `prefers-reduced-motion: reduce` the duration collapses to 0ms through
the global token override, so nothing here needs a branch. Transitions rather
than keyframes, so clicking through tabs quickly retargets each fade from
wherever it is.

## States

Selected, disabled, empty (nothing selected), long labels, and long panels, in
light and dark, in the `States` story. Hover and focus-visible are proved by
the input-path stories.

## Overflow and long labels

A horizontal list is a scroll container: labels stay on one line and the list
scrolls, and focusing a tab scrolls it into view. A vertical list wraps its
labels inside whatever width it is given.

## Tokens

Semantic: `color.foreground`, `color.foreground.muted`,
`color.foreground.disabled`, `color.primary`, `color.border`,
`color.focus-ring`, `radius.control`, `size.min-target`,
`space.control-padding-x`, `space.control-gap`, `space.stack-gap`,
`font.size.body`, `border-width.emphasis`, `duration.state-change`,
`easing.state`.

No component tokens. The tab height is the shared touch floor, and everything
else a semantic role already expresses.

## Testing

`Tabs.test.tsx` beside the source covers roles and relationships, the roving
tab stop and its fallbacks, every key in both orientations, both activation
modes, controlled and uncontrolled behaviour, dynamic tabs, `cn` keeping every
class, and the assertions that the shadcn adaptation stayed adapted. The
stories in `apps/storybook/src/stories/Tabs.stories.tsx` drive the same
behaviour through real user events and audit every story with axe.

What a test cannot see: the focus ring, the fade, and what a screen reader
says. Those are the manual checks in the story `Contract`.

## Known limitations

- **No RTL flip.** ArrowRight always moves to the next tab in DOM order. A
  right-to-left document would want the arrows mirrored, and nothing here reads
  `dir`.
- **`aria-controls` arrives at hydration.** See Dynamic content. A page served
  statically and never hydrated has panels named by their tabs, but tabs that do
  not point at their panels.
- **The indicator does not slide.** It fades in on the newly selected tab
  rather than travelling from the old one. Sliding needs a measured position,
  which means JavaScript reading layout on every selection; the fade needs
  neither and reads clearly enough.
- **No `dir`, no `loop` prop, no `forceMount`.** Radix has all three; none was
  needed for the issue, and each is a decision to make when something asks for
  it.
- Browser routing integration and drag-reorderable tabs are out of scope by
  the issue.
