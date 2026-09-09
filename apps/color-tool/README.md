# spartant-color-tool

The OKLCH scale visualizer and export tool. Private, never published.

```bash
pnpm dev:color-tool
```

Generate a ramp from a seed, see where it clamps to reach sRGB, check it against
the contrast policy, compare it with the committed tokens, and export it in the
token JSON format ready to paste into `primitive/color.tokens.json`.

## Why it exists

The scale contract in
[`COLOR.md`](../../packages/spartant/src/tokens/COLOR.md) is deterministic, so a
seed fully determines a ramp. That makes editing token files by hand both
unnecessary and error-prone: you cannot see what a hue change does to contrast
until it is committed and the audit runs.

## What it does not do

It never writes to the repository. Export, review, paste. The audit in
`pnpm check:colors` is what decides whether a ramp is acceptable, and a tool that
could commit its own output would route around it.

## Boundary note

The colour maths lives in `packages/spartant/tooling/color/`, which is
build-time code and is deliberately not part of the published package. This tool
reaches it through the `@spartant-color/*` path alias. Both workspaces are
private, so the coupling is contained. If a third consumer appears, extract the
maths into its own internal workspace package rather than widening the alias.
