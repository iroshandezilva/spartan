# Styling

Tailwind CSS with CSS custom properties as the semantic boundary. No SCSS, by
architecture decision.

## Files

| File         | Role                                                                 |
| ------------ | -------------------------------------------------------------------- |
| `tokens.css` | Semantic custom properties for light and dark. Provisional values.    |
| `theme.css`  | Imports tokens and maps them into Tailwind theme namespaces.          |
| `index.css`  | Imports Tailwind and `theme.css`, and declares source scanning.       |

The build compiles `index.css` into a self-contained `dist/styles/index.css`,
and copies `theme.css` and `tokens.css` to `dist/styles/` as source.

## The three layers

Defined in [`../tokens/README.md`](../tokens/README.md), which is authoritative
for the taxonomy, the naming grammar, state names, theme and consumer override
boundaries, and deprecation.

1. **Primitive** raw scales. Source lives in `../tokens/primitive/`.
2. **Semantic** roles. What components consume.
3. **Component** only when a stable requirement cannot be expressed
   semantically.

The names in `tokens.css` are provisional and predate the taxonomy. HAUX-32
replaces this hand-written file with generated output and renames each custom
property to include its category, for example `--spartant-foreground-muted`
becomes `--spartant-color-foreground-muted`. The migration table is in the
taxonomy document.

Components consume semantic roles, never raw values. Writing `bg-[#3b5bdb]` or
reaching past a role to a palette step is the thing this structure exists to
prevent.

## Why `@theme inline`

`@theme inline` makes generated utilities reference the custom property rather
than copy its value. That is what lets a theme change or a consumer override
retype the whole system at runtime, with no rebuild and no markup change.

Using plain `@theme` would bake the light values into every utility and break
dark mode.

## Overriding

`--spartant-*` is the stable, documented override entry point:

```css
:root {
  --spartant-primary: oklch(60% 0.2 150);
}
```

Every utility built on that role follows, in both themes.
