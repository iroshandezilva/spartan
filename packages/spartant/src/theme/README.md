# Theme application and switching

Light, dark, and system. Decided and built in HAUX-35.

## How it works

**The DOM is the source of truth.** `data-theme` on the root element decides
what is shown. React state mirrors it rather than owning it, which is what lets
a blocking script set the theme before React exists.

| Value | Effect |
| --- | --- |
| `data-theme="dark"` | Dark, whatever the browser prefers |
| `data-theme="light"` | Light, whatever the browser prefers |
| attribute absent | Follows `prefers-color-scheme` |

**`system` removes the attribute** rather than writing a resolved value. Writing
`dark` for a system preference would freeze the choice, and the page would stop
following the browser when the user changes their setting mid-session.

## Client-only apps

```tsx
import { ThemeProvider } from "@iroshandezilva/spartant";

<ThemeProvider>
  <App />
</ThemeProvider>;
```

The provider renders no wrapper element. It writes the attribute on the document
root, so themes apply without any component's markup changing.

```tsx
const { theme, resolvedTheme, setTheme } = useTheme();
```

`theme` is what the user chose, including `system`. `resolvedTheme` is what is
on screen, always `light` or `dark`.

## Server-rendered apps

The provider alone cannot prevent a flash: it only runs once React has hydrated,
which is after first paint. Inline the blocking script in `<head>`, **before any
stylesheet**:

```tsx
import { themeScript } from "@iroshandezilva/spartant";

<head>
  <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
</head>;
```

It reads the stored preference and sets the attribute before the browser paints,
so a user with dark selected never sees a flash of light.

### Why this does not cause a hydration mismatch

The server cannot know the browser preference, so `ThemeProvider` renders the
same markup regardless of it. The system preference is read through
`useSyncExternalStore` with a server snapshot fixed at `light`, and the stored
preference is read in an effect. The first client render therefore matches the
server exactly, and the real values arrive after hydration.

The blocking script only touches an attribute on `<html>`, which React does not
hydrate, so it cannot disagree with the markup either.

Both paths are covered by tests: server output is asserted identical under
opposite browser preferences, and a full hydration is run with `dark` stored,
asserting no mismatch warning.

## Consumer overrides

Overriding `--spartant-*` is the documented, stable entry point:

```css
:root {
  --spartant-color-primary: oklch(60% 0.2 150);
}
```

Every utility built on that role follows, in both themes, with no rebuild. See
[`../tokens/README.md`](../tokens/README.md) for the naming grammar.

## Accessibility

A switcher is ordinary markup, so use a real `<button>` and it is keyboard
operable and announced for free. The example uses `aria-pressed` to expose which
choice is active.

Spartant does not ship a switcher component. Theme choice belongs to the
application's own navigation, and a design system that dictates its placement
gets in the way. `useTheme` gives you everything you need.

## Storage

The choice is kept in `localStorage` under `spartant-theme`, and every read and
write tolerates failure. Private mode, blocked cookies, and a full quota all
throw, and none of them are worth taking a page down for. The theme still
applies for that page view; it just is not remembered.

## Limits

Light, dark, and system. More themes are deliberately out of scope: the semantic
layer supports any number of them, but shipping a third would mean a decision
about what it is for.
