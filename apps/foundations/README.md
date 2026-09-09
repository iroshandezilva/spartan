# spartant-foundations

Specimens for the non-colour foundations. Private, never published.

```bash
pnpm dev:foundations
```

Typography at real sizes, the spacing scale, radius and elevation samples, and
motion demos with a slow-motion multiplier and a reduced-motion simulation.

## Why it exists

HAUX-34 requires real-size specimens, and a table of numbers is not a specimen.
Whether 16px at 1.5 reads comfortably, or a 4px spacing base produces a coherent
rhythm, is only answerable by looking.

The motion controls exist because the standard's manual review asks for motion
at normal and slowed playback, and under reduced motion. Both work by overriding
the motion tokens on that subtree, which is the same mechanism the real
`prefers-reduced-motion` rule uses. A demo that ignored the controls would be
reaching past a token for a raw value, which is itself the thing to catch.

## Relationship to Storybook

HAUX-39 builds Storybook, whose acceptance criteria include a foundations story.
When that lands, this app is a candidate for retirement rather than a thing to
maintain in parallel. It exists now because HAUX-34 needs specimens now.

All values are read from `@iroshandezilva/spartant/tokens.json`, so the page
cannot drift from what the package ships.
