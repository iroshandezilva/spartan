# Release notes

One file per user-visible change. Each file says how the change affects the
version, what a consumer needs to know, and which Linear issue it came from.
[`pnpm release:prepare`](../scripts/release-prepare.mjs) folds every pending
file into [`CHANGELOG.md`](../CHANGELOG.md) and deletes it.

Documented version: <!-- spartant-version -->0.0.0<!-- /spartant-version -->

## Why this and not Changesets

Changesets is the obvious tool here and was the first candidate. It was not
adopted, for four reasons specific to this repository:

1. Its main value is a dependency graph across many published packages. Spartant
   publishes exactly one package, so that value is zero.
2. Its useful gate, `changeset status --since`, needs Git history and a base
   ref. This repository has no Git repository, no remote, and no branches, so
   that part could not run today either way.
3. Its changelog format and version policy are its own. This project already has
   a version policy, and a `kind` to bump mapping that a generic tool cannot
   enforce.
4. It is a dependency and a CLI to keep current, and `AGENTS.md` asks for the
   smallest implementation that satisfies the issue.

What replaced it is four small scripts and no new dependency. The cost of that
choice is that nothing here integrates with the Changesets GitHub bot. If
Spartant ever publishes several packages together, revisit this.

## Writing a note

```
pnpm release:note --kind=component --bump=minor --issue=HAUX-43 --summary="Add Button"
```

That writes a file you then edit. Writing the file by hand is equally fine. The
format is:

```md
---
kind: component
bump: minor
issue: HAUX-43
---

Add `Button` with `variant` and `size` props.

Any further paragraphs are context. Only the first line reaches the changelog.
```

- `kind` is one of the kinds in the table below.
- `bump` is `patch`, `minor`, or `major`, and must be one the kind allows.
- `issue` is a Linear identifier such as `HAUX-43`, which becomes a link in the
  changelog, or `none` when no issue applies.
- The first line of the body is the changelog entry. Write it for a consumer,
  not for a reviewer.

## Kinds and version guidance

This is the version policy from the CI plan expressed as a rule the check can
enforce. Patch is a compatible fix. Minor is a backward-compatible addition.
Major is a breaking API, token, behaviour, or package-structure change.

| Kind | Allowed bumps | Use it for |
| --- | --- | --- |
| `component` | minor, major | A new component, variant, or size is minor. Changing or removing one is major. A defect inside an existing component is `fix`. |
| `api` | minor, major | A new public export or prop is minor. Renaming, narrowing, or removing one is major. |
| `token` | patch, minor, major | Correcting a token value is patch. Adding a semantic role is minor. Renaming, removing, or deprecating one is major. |
| `fix` | patch, major | A compatible fix is patch. A fix that changes documented behaviour is major. A fix is never minor. |
| `docs` | patch | Documentation tied to package behaviour. Documentation site work that does not change the package needs no note. |
| `build` | patch, major | Internal build changes that reach the tarball are patch. A package-structure change is major. |

A note that claims a bump its kind does not allow fails the check. That is the
point: the mapping is not advice.

## Breaking changes

A `major` note must contain a `## Migration` section with real instructions, and
that section must not be empty:

```md
---
kind: api
bump: major
issue: HAUX-99
---

Rename the `tone` prop on `Button` to `variant`.

## Migration

Replace `tone` with `variant`. The accepted values are unchanged.

Before: `<Button tone="primary" />`
After:  `<Button variant="primary" />`
```

Being below `1.0.0` does not excuse this. The version policy says so, and the
check enforces it.

Below `1.0.0`, a `major` note moves the minor segment rather than declaring
`1.0.0`. Reaching a stable major through the first breaking change of a v0.1
system would be an accident. Pass `--version=` to `pnpm release:prepare` when a
release should not follow that rule.

## Checking

```
pnpm release:check
```

It fails when a note is malformed, when a kind and bump disagree, when a
breaking change has no migration guidance, or when a documentation version
reference disagrees with the package version. It then prints the proposed bump
and version.

It also checks that a change touching the published package carries a note at
all. That part needs a diff, so it needs Git. This repository is not a Git
repository yet, so the check reports loudly that it could not run rather than
passing silently. Once Git and `main` exist, CI should run:

```
pnpm release:check --strict --base=origin/main
```

`--strict` turns that warning into a failure. Until then, the gate in the
pull request flow is the release-note section of
[`PULL_REQUEST_TEMPLATE.md`](../.github/PULL_REQUEST_TEMPLATE.md).

## Version references in documentation

Any Markdown file can carry a version reference that stays correct without
anyone remembering to update it. Wrap the version in the paired
`spartant-version` HTML comments, as the "Documented version" line near the top
of this file does. `pnpm release:prepare` rewrites every one of them, and
`pnpm release:check` fails when one disagrees with the package manifest.

## Preparing a release

```
pnpm release:plan       # propose only, writes nothing
pnpm release:prepare    # apply
```

`release:prepare` does the whole preparation in one run, so the parts cannot
drift apart. It bumps the package version, writes a dated changelog section,
rewrites the documentation version references, deletes the consumed notes, and
writes a release pull request body to `.artifacts/release-<version>.md`.

It runs no Git command. It prints the branch, commit, and pull request commands
to run, so that a release lands as one reviewable change with a generated
description rather than a hand-written one.
