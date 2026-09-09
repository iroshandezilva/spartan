# Contributing to Spartant

Read [`AGENTS.md`](../AGENTS.md) first. It is the authoritative guide for humans
and coding agents alike, and it covers the source-of-truth order, the Linear
workflow, boundaries, verification, manual-test policy, the definition of done,
and the stop conditions. This file only orients you.

## Where requirements come from

Linear, not this repository and not chat. Every change traces to an issue in the
[Spartant Design System project](https://linear.app/wearehaux/project/spartant-design-system-b4328c010ac8/overview).
An issue's acceptance criteria and its attached specifications are what the work
is judged against.

## The loop

1. Take an issue that is `Ready to Start` with all blockers complete.
2. Read the issue and every attached document before editing anything.
3. Move it to `In Progress` before you touch a file.
4. Implement the smallest change that satisfies the acceptance criteria.
5. Run `pnpm validate`, plus any additional check the issue names.
6. Open a pull request using the template and fill in every section honestly.
7. Post the completion report and move the issue to `Agent Done`, never `Done`.

Iroshan moves an issue to `Done` after review and any required manual test.

## Setup

```bash
pnpm install
pnpm validate
```

pnpm is required. A `preinstall` guard rejects npm and yarn. See `README.md` for
the full command matrix.

## Two rules worth repeating

- **Do not expand scope.** Work outside the issue belongs in a new issue, even
  when it is obviously worth doing.
- **Do not claim a check passed unless you ran it** and can show the output.
