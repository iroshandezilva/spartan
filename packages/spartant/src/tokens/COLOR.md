# OKLCH scale generation, gamut handling, and contrast policy

Decided in HAUX-31. The executable form lives in `../../tooling/color/`, so the
policy and the checks cannot drift apart.

The seeds here are examples that make the contract reviewable. HAUX-33 chooses
the palette Spartant actually ships.

## Why OKLCH

Lightness in OKLCH is perceptual. A ramp built on evenly spaced OKLCH lightness
looks evenly spaced, which is not true of HSL, where `hsl(60 100% 50%)` and
`hsl(240 100% 50%)` claim the same lightness and differ by roughly 15:1 in
measured luminance. Every rule below depends on lightness meaning something.

## The scale contract

Thirteen steps, shared by every family:

`0` `50` `100` `200` `300` `400` `500` `600` `700` `800` `900` `950` `1000`

### Lightness is fixed, not derived from the seed

| Step | 0 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 1000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L | 100% | 98% | 95% | 91% | 84% | 74% | 62% | 54% | 45% | 35% | 25% | 19% | 12% |

This is the load-bearing decision. Because lightness at a step is identical
across families, `danger.700` and `primary.700` carry the same weight, and a
theme can swap one family for another without re-deriving every contrast
pairing. A per-family lightness curve would make each family a separate
accessibility problem.

### Chroma peaks in the middle

Chroma is a fraction of the family's peak, reached at step 500:

| Step | 0 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 1000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Fraction | 0 | .06 | .12 | .24 | .44 | .72 | 1.0 | .98 | .86 | .66 | .46 | .34 | .18 |

Near-white and near-black steps hold little chroma, because a very light step at
full chroma reads as a colour cast rather than as a tint of that family.

### The spacing is deliberately uneven

Measured on the rendered ramps, the gap between adjacent steps in OKLab
lightness runs from **0.019 to 0.12**, roughly a six-fold spread. That is a
choice, not drift.

The light end is dense on purpose. Surfaces, hovers, subtle borders, and
selected backgrounds all live between steps 0 and 200, and they need to be
distinguishable from each other while all reading as "nearly white". The middle
of the ramp carries fewer roles and can afford wider gaps.

Every family was checked and every one is monotonic in measured lightness, so
the ordering is never ambiguous even where the spacing is tight.

### Hue is constant by default

A family declares one hue. A family may declare a linear `hueShift` across the
ramp, capped at **12 degrees**, for the warm-shadow effect some palettes want.
Beyond that a ramp stops reading as one family, so the generator throws rather
than producing it.

## Gamut handling

**Reduce chroma. Hold lightness and hue. Bisect to a fixed tolerance.**

Lightness and hue carry the meaning. Lightness is what every contrast guarantee
rests on, and hue is what makes a family recognisable. Chroma is the only axis
that can give way without breaking something the system promises.

The alternative, clipping RGB channels, shifts hue and lightness together and
silently invalidates the contrast work. It is not used.

The search runs at most 24 bisection steps to a tolerance of 1e-5, so it is
deterministic: the same input always produces the same output, with no
dependence on iteration order or accumulated error.

Gamut mapping is recorded, not hidden. Each generated step reports whether it
was clamped and what chroma was requested, so the visualizer in HAUX-36 can show
the cost rather than presenting a quietly duller colour as if it were asked for.

### What clamps, in the example seeds

| Family | Steps reduced to reach sRGB |
| --- | --- |
| `neutral` | none |
| `secondary` | none |
| `danger` | 50, 200 |
| `success` | 700, 800, 900 |
| `information` | 600, 700, 800, 900, 950 |
| `primary` | 50, 200, 300, 400 |
| `warning` | every step from 500 down |

`warning` clamping almost everywhere is not a bug. Yellow at hue 75 cannot hold
high chroma at low lightness in sRGB; no encoding makes a dark, saturated yellow
possible. The seed asks for more than the space contains and the policy resolves
it predictably.

## Light and dark generation

**One ramp serves both themes.** Dark mode does not get its own generated
palette. What changes is which step a role points at, and that mapping is
HAUX-33's job.

This holds because lightness is fixed per step. It means one set of values to
review, one set to keep in gamut, and no risk of the two themes drifting apart
as separate artefacts.

### Where the usable range sits

Measured against the generated ramps, identically for all seven families:

| Requirement | Rule |
| --- | --- |
| Body text on a white surface | step **600 or darker** |
| Body text on a black surface | step **500 or lighter** |

That consistency across families is the shared lightness contract paying off. It
gives HAUX-33 a rule rather than a per-family lookup.

Contrast against white, by step:

| Family | 0 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 1000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `neutral` | 1.0 | 1.1 | 1.2 | 1.3 | 1.6 | 2.3 | 3.6 | 5.1 | 7.4 | 11.3 | 16.0 | 18.5 | 20.3 |
| `primary` | 1.0 | 1.1 | 1.2 | 1.3 | 1.6 | 2.3 | 3.8 | 5.2 | 7.7 | 11.6 | 16.2 | 18.6 | 20.3 |
| `secondary` | 1.0 | 1.1 | 1.2 | 1.3 | 1.7 | 2.4 | 3.8 | 5.2 | 7.7 | 11.5 | 16.2 | 18.6 | 20.3 |
| `success` | 1.0 | 1.1 | 1.2 | 1.3 | 1.6 | 2.2 | 3.4 | 4.7 | 7.0 | 10.8 | 15.7 | 18.3 | 20.2 |
| `warning` | 1.0 | 1.1 | 1.2 | 1.3 | 1.6 | 2.3 | 3.7 | 5.2 | 7.6 | 11.4 | 16.1 | 18.5 | 20.3 |
| `danger` | 1.0 | 1.1 | 1.2 | 1.3 | 1.7 | 2.4 | 4.0 | 5.6 | 8.1 | 12.0 | 16.5 | 18.7 | 20.4 |
| `information` | 1.0 | 1.1 | 1.2 | 1.3 | 1.6 | 2.3 | 3.6 | 5.0 | 7.3 | 11.2 | 15.9 | 18.4 | 20.3 |

## Contrast policy

WCAG 2.2 AA, evaluated against **intended pairings** rather than every possible
combination. A role is only required to work where it is actually used.

| Use | Minimum | Applies to |
| --- | --- | --- |
| Body text | **4.5:1** | Text below 24px, or below 18.66px bold |
| Large text | **3:1** | 24px and above, or 18.66px bold and above |
| Non-text | **3:1** | Focus rings, and any boundary that carries state |
| Disabled | **exempt** | Checked for legibility, never blocking |

Disabled being exempt is WCAG's rule, not a Spartant shortcut. It is written
down because an unstated exemption is indistinguishable from an oversight.

### Required pairings

Every one of these must pass before release:

| Foreground | Background | Kind |
| --- | --- | --- |
| `color.foreground` | `color.background` | body text |
| `color.foreground` | `color.surface` | body text |
| `color.foreground.muted` | `color.background` | body text |
| `color.foreground.muted` | `color.surface` | body text |
| `color.primary.foreground` | `color.primary` | body text |
| `color.danger.foreground` | `color.danger` | body text |
| `color.success.foreground` | `color.success` | body text |
| `color.warning.foreground` | `color.warning` | body text |
| `color.information.foreground` | `color.information` | body text |
| `color.border.strong` | `color.background` | non-text |
| `color.border.strong` | `color.surface` | non-text |
| `color.focus-ring` | `color.background` | non-text |
| `color.focus-ring` | `color.surface` | non-text |
| `color.primary` | `color.background` | non-text |
| `color.foreground.disabled` | `color.surface.disabled` | disabled |

Each pairing is checked in **both themes**. A role that passes in light and
fails in dark is a failure.

Focus rings appear twice on purpose. A focus indicator that is visible on the
page background but disappears on a card is the most common way keyboard users
lose their place.

### When a pairing fails

A failing required pairing **blocks release**. The paths out, in order of
preference:

1. **Change the mapping.** Move the role to a darker or lighter step. This is
   almost always the right answer, and the usable-range rule above says which
   step to reach for.
2. **Change the seed.** If a family cannot serve its roles at any step, the seed
   is wrong.
3. **Record a reviewed exception.** Last resort, and only with evidence.

An exception is data, never a code path:

```ts
{
  foreground: "color.foreground.muted",
  background: "color.surface",
  accepted: 4.1,
  reason: "Caption text only, never used for interactive labels.",
  approvedIn: "HAUX-00",
}
```

`approvedIn` is required, so every exception traces to a decision. Exceptions
are listed in the validator's output rather than silently skipped, which is what
makes them searchable and reviewable later. An exception without an approving
issue is not an exception; it is a failure that someone edited around.

## Example seeds

| Family | Hue | Peak chroma |
| --- | --- | --- |
| `neutral` | 264 | 0.014 |
| `primary` | 264 | 0.19 |
| `secondary` | 300 | 0.09 |
| `success` | 150 | 0.15 |
| `warning` | 75 | 0.17 |
| `danger` | 27 | 0.2 |
| `information` | 240 | 0.14 |

Generated output, as hex for review:

| Family | 0 | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 | 1000 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `neutral` | #ffffff | #f8f8f9 | #eeeeef | #e0e1e3 | #c8cacf | #a7abb1 | #82868f | #6b6f77 | #52555c | #383b3f | #202225 | #131416 | #050606 |
| `primary` | #ffffff | #f5f9ff | #e7effe | #d3e2ff | #b1cbff | #7fa9ff | #497ef7 | #3465d9 | #244cae | #17347b | #0b1e4b | #051130 | #020512 |
| `secondary` | #ffffff | #f9f8fc | #efedf5 | #e3deee | #cec5e1 | #b1a2ce | #8e7ab5 | #77629a | #5c4b7a | #3f3355 | #251d33 | #16111f | #06050b |
| `success` | #ffffff | #f4faf5 | #e6f2e8 | #d1e9d5 | #add7b4 | #77be86 | #2e9e52 | #06853c | #00672d | #00481d | #002a0e | #011a07 | #010802 |
| `warning` | #ffffff | #fdf8f1 | #f7ede0 | #f2dec4 | #e8c494 | #d89f49 | #b37900 | #956300 | #734c00 | #513400 | #301d00 | #1e1100 | #0b0500 |
| `danger` | #ffffff | #fff6f5 | #fee9e6 | #ffd6d1 | #ffb5ac | #f88478 | #e6443d | #c72726 | #9f1317 | #700c0e | #440606 | #2c0303 | #110201 |
| `information` | #ffffff | #f4f9fe | #e5f0f9 | #cee5f6 | #a7d1ef | #6cb3e4 | #0a8fd1 | #0076af | #005b88 | #003f60 | #00243a | #001625 | #00070e |

These tables are generated from `../../tooling/color/`. If the generator
changes, regenerate them rather than editing by hand.

## Ownership

| Area | Owner |
| --- | --- |
| This policy | HAUX-31. Changes need a decision issue. |
| Applying it to real roles | HAUX-33 |
| Automated enforcement in CI | HAUX-37 |
| The visualizer | HAUX-36 |
