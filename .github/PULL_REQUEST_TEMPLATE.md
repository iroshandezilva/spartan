## Linked issue

<!-- Required. One issue per pull request. -->

Closes HAUX-

## What changed

<!-- The outcome, then the main areas or files. Not a commit log. -->

## Public API and contract

<!-- Delete any line that does not apply. -->

- [ ] No change to public exports, component props, or semantic token names
- [ ] Public API changed, and the change is described below
- [ ] A dependency was added or removed, with justification below
- [ ] Generated artifacts and package exports are synchronized

## Release note

<!-- Exactly one of these. -->

- [ ] A release note exists under `.changes/`, and `pnpm release:check` passes
- [ ] **No release note**, because this change is not visible to a consumer of the package. Reason:

A breaking change needs a `## Migration` section in its note, including before
1.0. The format and the kind to version mapping are in
[`.changes/README.md`](../.changes/README.md).

## Checks run

Paste the command and its result. Do not tick a box for a check you did not run.

| Check | Command | Result |
| --- | --- | --- |
| Full gate | `pnpm validate` | |
| Package contents | `pnpm inspect:package` | |

<!-- Add rows for anything else the issue named. Explain any normally
applicable check you skipped, and why. -->

## Manual testing

<!-- Exactly one of these. -->

- [ ] **Manual test required.** Environment, exact steps, expected result, actual result, and evidence:
- [ ] **Manual test not required.** Reason:

Manual testing is normally required for changes affecting keyboard navigation, focus, screen readers, pointer or touch behavior, theme appearance, responsive or long-content behavior, animation, reduced motion, package installation, or production deployment.

Use [`MANUAL-REVIEW.md`](../MANUAL-REVIEW.md) and paste its result block above.

## Motion

<!-- Required for any component change. Delete if this pull request touches no component. -->

- [ ] **No motion**, and the rationale is:
- [ ] **Motion**, with the purpose, tokens used, pointer, touch and keyboard behavior, reduced-motion behavior, and interruption behavior described below:

## Storybook and documentation

- [ ] Required stories exist and cover the applicable states
- [ ] Documentation and examples match the implementation
- [ ] Not applicable, because:

## Screenshots or artifacts

<!-- Required when the change is visible, and for theme, layout, or motion
changes. Include light and dark. A short clip is better than a still for
motion. Link the CI Storybook artifact when relevant. -->

## Risks and follow-ups

<!-- Known limitations, deferred work, and linked follow-up issues. Write
"None" only if you actually looked. -->
