# Button and Icon Button variable bindings

Read from Spartan DS with the Figma MCP (`use_figma`, read-only) on 2026-10-09. Component sets:
Button `21:27` (168 variants) and Icon Button `326:63` (15 variants). Variable names are the Figma
names; the code name is `--sp-` plus the collection prefix (none for 03 to 06) plus the name with
`/` as `-`, for example `button/height/base` is `--sp-button-height-base`. Collections 01 Primitives
and 02 Primary use `--sp-prim-` and `--sp-hue-`.

Values are the resolved result in each density mode. Tests check every chain in
`tests/figma-tokens.test.ts`; the browser tests check the rendered results.

## Button

Variant (7): Primary, Secondary, Danger, Ghost, Dashed, Danger Subtle, Warning. Size (2): Small,
Base. State (6): Default, Hover, Pressed, Focus, Disabled, Loading. Shape (2): Rounded, Pill.
Properties: Label, Show left icon, Left icon (swap), Show right icon, Right icon (swap).

### Size, spacing, radius, density

| Part | Figma variable | Chain | Relaxed | Compact |
| --- | --- | --- | --- | --- |
| Height, Base | `button/height/base` | `density/control/height/base` | 40 | 32 |
| Height, Small | `button/height/sm` | `density/control/height/small` | 32 | 28 |
| Outer padding, Base | `button/outer-padding-x/base` | `density/button/outer-padding-x/base`, then `space/optical/10` or `/6` | 10 | 6 |
| Outer padding, Small | `button/outer-padding-x/sm` | `density/button/outer-padding-x/small`, then `space/2` or `space/optical/6` | 8 | 6 |
| Label padding, Base | `button/label-padding-x/base` | `space/optical/6` | 6 | 6 |
| Label padding, Small | `button/label-padding-x/sm` | `space/1` | 4 | 4 |
| Item spacing and label vertical padding | `space/0` | primitive | 0 | 0 |
| Radius, Rounded | `radius/control` | `radius/md` | 8 | 8 |
| Radius, Pill | `radius/pill` | `radius/full` | 9999 | 9999 |
| Icon frame, Base | `density/control/icon-size/base` | literal | 20 | 18 |
| Icon frame, Small | `density/control/icon-size/small` | literal | 16 | 16 |

Total side padding is outer plus label: Base 16 and 12, Small 12 and 10, matching
`density/control/padding-x/base` and `/small`.

### Typography

| Part | Figma variable | Relaxed | Compact |
| --- | --- | --- | --- |
| Label size, Base | `density/control/font-size/base` | 15 | 14 |
| Label size, Small | `density/control/font-size/small` | 14 | 13 |
| Label line height, Base | `density/control/line-height/base` | 22 | 20 |
| Label line height, Small | `density/control/line-height/small` | 20 | 18 |

Not bound to a variable: font family (Inter), weight (Medium, 500), and letter spacing (0%). Code
uses `--sp-font-family-body` and `--sp-font-weight-emphasis`, which resolve to the same values.

Known mismatch in the file: the Base label text node reads 16 px and 24 px although it is bound to
`font-size/base` and `line-height/base` (15 and 22 in Relaxed). Small matches. Code follows the
variables.

### Color

Every semantic color lives in 03 Semantic Color and resolves per theme mode, and per Primary hue
where it aliases a hue.

| Variant | Fill (Default, Hover, Pressed) | Text | Other |
| --- | --- | --- | --- |
| Primary | `color/primary/default`, `/hover`, `/active` | `color/primary/foreground` | two shadows |
| Secondary | `color/secondary/default`, `/hover`, `/active` | `color/secondary/foreground` | two shadows |
| Danger | `color/danger/default`, `/hover`, `/active` | `color/danger/foreground` | |
| Ghost | none; Hover `color/secondary/hover`, Pressed `color/secondary/active` | `color/foreground/default` | |
| Dashed | `color/dashed/default`, `/hover`, `/active` (alpha-bound) | `color/secondary/foreground` | dashed stroke `color/dashed/border`, weight `border-width/default` |
| Danger Subtle | `color/danger/subtle/default`, `/hover`, `/active` (alpha-bound) | `color/danger/text` | |
| Warning | `color/warning/default`, `/hover`, `/active` | `color/warning/foreground` | |

- Shadows on Primary and Secondary: `color/shadow/control/ambient` at offset 0,1 with blur 3, and
  `color/shadow/control/edge` at offset 0,0 with blur 2.
- Disabled, every variant: fill `color/surface/disabled` (Ghost has none), text
  `color/foreground/disabled`, no shadows.
- Focus: a 2 px ring `color/focus-ring/default` drawn in a frame 4 px outside the button, radius 12.
- Loading: the label and icons are transparent and a 16 px wave-bars spinner is centered, tinted
  with the variant's foreground.
- Dashed border weight is `border-width/default`: 1 in Light and Dark, 2 in the high contrast modes.

## Icon Button

Variant (5): Primary, Secondary, Danger, Ghost, Dashed. Size (3): Extra small, Small, Base. There
is no Danger Subtle, Warning, Shape, or State variant.

| Part | Figma variable | Chain | Relaxed | Compact |
| --- | --- | --- | --- | --- |
| Width and height, Extra small | `button/height/xs` | `density/control/height/extra-small`, `density/space/6` | 24 | 24 |
| Width and height, Small | `button/height/sm` | `density/control/height/small` | 32 | 28 |
| Width and height, Base | `button/height/base` | `density/control/height/base` | 40 | 32 |
| Padding and gap | `density/space/0` | primitive | 0 | 0 |
| Radius | `radius/control` | `radius/md` | 8 | 8 |
| Icon frame, Extra small and Small | `density/control/icon-size/small` | literal | 16 | 16 |
| Icon frame, Base | `density/control/icon-size/base` | literal | 20 | 18 |

- Fill and icon color follow Button: Primary, Secondary, Danger use `color/<variant>/default` and
  `/foreground`; Dashed uses `color/dashed/default`, `color/dashed/border`, and
  `color/secondary/foreground`; Ghost has no fill and uses `color/foreground/default`.
- Primary and Secondary carry the same two control shadows. Danger, Ghost, and Dashed have none.
- Secondary has a bound stroke weight (`border-width/default`) but no stroke is drawn.
- Figma has no hover, pressed, focus, or disabled variants for this set. Code reuses the Button
  rules for those states.
