# Token taxonomy, naming, and source format

The approved token model for Spartant. Decided in HAUX-30.

The values in these files are **illustrative examples of the format**, not the
design. Final values are HAUX-31 for colour, HAUX-33 for theme mappings, and
HAUX-34 for the other foundations.

## Three layers

| Layer | Holds | Named after | Consumed by |
| --- | --- | --- | --- |
| **Primitive** | Literal values. Raw scales. | The value. `neutral.500`, `space.4` | Semantic tokens only |
| **Semantic** | Aliases to primitives. Roles. | The meaning. `foreground.muted` | Components, themes, consumers |
| **Component** | Literal or alias. Rare exceptions. | The component and property. `button.height.md` | One component |

The rules that hold the layering up, all machine-checked:

- A **semantic token never holds a literal.** A literal in the semantic layer is
  a primitive hiding in the wrong place, and it is invisible to a theme.
- A **primitive never holds an alias.** Primitives are where values live.
- A **semantic path never collides with a primitive path.** When it does, an
  alias to it resolves to itself and the layering silently collapses. This is
  not hypothetical: `opacity.disabled` and `duration.press` both existed in both
  layers in the first draft of these files, and the check found them.
- **Components consume semantic roles.** Reaching past a role to a palette step
  is the failure the layering exists to prevent.

### When a component token is justified

Almost never. The test is: *can this be expressed as a semantic role without
inventing a role that only one component would ever use?* If yes, use the role.

`button.height.md` is the worked example that passes the test. It is 44px, an
accessibility floor from the motion standard. It is deliberately not derived
from the spacing scale, so that tightening spacing cannot silently shrink a
touch target below the minimum. That is a structural requirement, not a
spacing decision.

A component token that duplicates a global role is rejected in review.

## Naming grammar

Names are lower-case kebab-case segments joined by dots. Path segments become
CSS custom property segments, joined with hyphens.

```
--spartant-<path with dots replaced by hyphens, trailing `default` removed>
```

`color.foreground.muted` becomes `--spartant-color-foreground-muted`.
`color.surface.default` becomes `--spartant-color-surface`.

The mapping is mechanical with no special cases, which matters more than
brevity: an agent can derive the CSS name from the token path and back again
without consulting a table.

### Semantic colour

```
color.<role>[.<modifier>][.<state>]
```

`default` is the modifier slot when a role has variants, and is dropped on
emission. Modifiers describe emphasis or pairing:

| Modifier | Meaning |
| --- | --- |
| `default` | The role itself. Omitted from the emitted name. |
| `subtle`, `muted`, `strong` | Emphasis relative to the role. |
| `elevated` | A raised variant of a surface. |
| `inverse` | For use on the role's opposite. |
| `foreground` | The colour guaranteed legible **on** that role. |

### Other categories

| Category | Primitive | Semantic |
| --- | --- | --- |
| Colour | `color.neutral.500` | `color.foreground.muted` |
| Spacing | `space.4` | `space.control-padding-x` |
| Radius | `radius.md` | `radius.control` |
| Border width | `border-width.thin` | `border-width.default` |
| Typography | `font.size.md`, `font.weight.medium`, `font.family.sans`, `font.line-height.normal` | `font.size.body`, `font.weight.emphasis`, `font.family.body` |
| Elevation | `elevation.sm` | `elevation.surface` |
| Opacity | `opacity.50` | `opacity.disabled` |
| Motion duration | `duration.fast` | `duration.state-change` |
| Motion easing | `easing.out` | `easing.enter` |

Primitives are steps on a scale, so opacity primitives are `50` and `70`, not
`disabled` and `muted`. Meaning is the semantic layer's job. Motion primitives
keep the purpose names from the Motion and Micro-interaction Standard, which is
the one deliberate exception, and semantic motion roles are named for the
interaction they serve.

## State names

A closed set. Always the **last** segment, never anywhere else.

`hover` · `active` · `selected` · `disabled` · `invalid` · `focus`

Consistency here is the point. A state means the same thing on every component,
so `color.surface.disabled` reads identically whether the surface is a button or
a card.

Two rules follow from the set being closed:

- **`pressed` is not a state name.** Use `active`, which is what CSS calls it.
  Two names for one state is how a system starts disagreeing with itself.
- **A state word is never a role.** The first draft of these files had
  `color.disabled` and `color.selected` as roles, which put a state in a
  non-final position and made `disabled` mean two things. They are now
  `color.surface.disabled`, `color.foreground.disabled`, and
  `color.surface.selected`. The check found this too.

## Themes

A theme file restates semantic roles under a different appearance. Light is the
base; a theme file contains only what differs.

A theme **may** override the semantic layer. A theme **may not**:

- Redefine a primitive, which would change that value in every theme at once.
- Redefine a component token, because a component's structural requirements do
  not change with appearance. A 44px touch target is 44px in the dark.
- Introduce a role that has no semantic base. A theme restates roles; it does
  not invent them. This is checked.

## Override boundaries

There are two audiences and one supported surface.

**Themes** override by shipping a theme file, which is compiled into the
stylesheet.

**Consumers** override by redefining `--spartant-*` custom properties in their
own CSS:

```css
:root {
  --spartant-color-primary: oklch(60% 0.2 150);
}
```

Every utility built on that role follows, in both themes, with no rebuild.

What consumers must **not** do, and what the system therefore does not promise
to keep stable:

- Read the primitive JSON or TypeScript exports to build a theme. Those exist
  for the colour visualizer in HAUX-36 and for type-level checks, not as a
  theming API.
- Depend on a component token. It may be removed the moment the requirement is
  expressible semantically.
- Depend on which primitive a role happens to alias today.

## Deprecation

A token is never deleted in place. It is marked, kept, and removed on a
schedule:

```json
{
  "$value": "{color.neutral.200}",
  "$deprecated": "Renamed for grammar conformance.",
  "$extensions": {
    "com.spartant": { "replacedBy": "color.surface.muted", "removeIn": "0.2.0" }
  }
}
```

Rules, all checked:

- `$deprecated` carries the reason, in prose, for whoever finds the token.
- `replacedBy` is required and must resolve to a live token. A deprecation with
  nowhere to go is a break with extra steps.
- `removeIn` is required and is a semantic version.
- The token keeps emitting until that version, aliased to its replacement, so
  existing consumer CSS keeps working.
- Removal happens in a major release, or with an explicit migration note before
  1.0.

## Source format

W3C Design Tokens Community Group JSON, one `*.tokens.json` file per area,
narrowed by `schema/spartant-tokens.schema.json`.

DTCG was chosen over a bespoke format because it is what the surrounding tools
already speak: Style Dictionary, Figma variable import and export, and Tokens
Studio. A bespoke format would have to earn that interoperability back.

```
tokens/
  schema/     the JSON Schema every file validates against
  primitive/  raw scales
  semantic/   roles
  component/  justified exceptions
  theme/      appearance overrides
```

Types in use: `color`, `dimension`, `duration`, `cubicBezier`, `number`,
`fontFamily`, `fontWeight`, `shadow`.

### One source, three outputs

`pnpm check:tokens` validates the sources and then proves the format can produce
all three targets by performing the transform in memory:

- **CSS** custom properties, for the semantic and component layers. Primitives
  are deliberately **not** emitted to CSS, so a component cannot reach past a
  role to a palette step.
- **JSON**, fully resolved, which is what the visualizer in HAUX-36 reads.
- **TypeScript**, a `const` array of semantic names plus a union type, so a
  token name can be checked at compile time.

That is a feasibility proof, not the pipeline. HAUX-32 builds the real
generator and the drift check that fails when the committed outputs are stale.

## Relationship to the current stylesheet

`../styles/tokens.css` is hand-written and predates this model. It uses shorter
provisional names such as `--spartant-primary` and `--spartant-foreground-muted`.

HAUX-32 replaces that file with generated output using the grammar above, which
renames every custom property to include its category:

| Provisional, today | Generated, after HAUX-32 |
| --- | --- |
| `--spartant-background` | `--spartant-color-background` |
| `--spartant-foreground-muted` | `--spartant-color-foreground-muted` |
| `--spartant-primary-hover` | `--spartant-color-primary-hover` |
| `--spartant-disabled-background` | `--spartant-color-surface-disabled` |
| `--spartant-selected` | `--spartant-color-surface-selected` |
| `--spartant-radius-md` | `--spartant-radius-control` |

Nothing is published, so this costs one regenerated file rather than a
migration. The rename buys a mapping with no special cases.

## Ownership

| Area | Owner |
| --- | --- |
| This taxonomy | HAUX-30. Changes need a decision issue. |
| Colour primitives, gamut, contrast policy | HAUX-31, specified in [`COLOR.md`](./COLOR.md) |
| Typography, spacing, radius, elevation, motion primitives | HAUX-34 |
| Semantic mappings, light and dark | HAUX-33 |
| Generator and drift check | HAUX-32 |
| Contrast, gamut, and drift validation | HAUX-37 |
| A component token | The component's own issue, with written justification |
