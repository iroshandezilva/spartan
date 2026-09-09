# Visual review

How a visual change gets looked at before it merges, and why it is done this
way rather than with a hosted service.

## The decision

**v0.1 reviews visual change through the static Storybook build that CI
retains as an artifact. No hosted visual-regression provider is adopted.**

Frozen in HAUX-26 on 8 September 2026 and formalised here. Adopting a paid
provider later is a decision issue, not a pull request.

This is not "no visual review". It is visual review by a person looking at a
complete, deterministic build of every story, rather than by a service
comparing screenshots. For a design system with one reviewer and a handful of
components, the second thing costs money and attention that the first does not,
and catches a class of regression that barely exists yet.

## What was compared

| | Hosted provider | CI artifact, chosen | Local screenshot baseline |
| --- | --- | --- | --- |
| **Cost** | Free tiers exist but are priced per snapshot, and snapshot count grows with stories times variants times themes. This system will multiply quickly. | None beyond Actions minutes already spent building Storybook. | None. |
| **Setup** | An account, a project token in repository secrets, a CI step, and a decision about which branches upload. | One `upload-artifact` step. Already done. | A browser driver, a screenshot runner, and a policy for platform-dependent rendering. |
| **Review flow** | A web UI diffing against a baseline, with accept and reject. Genuinely good. | Download the artifact, `pnpm review:storybook <path>`, look at the stories the change touched. | Diff images in the repository, reviewed in the pull request. |
| **Branch behaviour** | Needs a baseline branch and a story about what happens on a first run, a rebase, and a force push. | None. Every run is self-contained. | Baselines live in Git, so every visual change is also a binary diff in review. |
| **Maintenance** | Flaky diffs from font rendering, animation timing, and platform differences. Someone has to triage those or the signal dies. | The build already runs. Nothing extra to keep alive. | The highest. Screenshots taken on a developer machine and in CI will differ, and reconciling that is a project of its own. |
| **Catches** | Unintended pixel change anywhere, including stories nobody thought to open. | What the reviewer looks at. | Unintended pixel change, if the baselines are trustworthy. |

The honest trade is the last row. A hosted provider catches the regression in a
story nobody opened; this does not. That is an acceptable trade at v0.1 scale
and an unacceptable one at some larger scale, which is why the decision is
recorded rather than assumed.

**Revisit when** the component count makes opening the affected stories
impractical, when more than one person reviews, or when a visual regression
reaches a consumer. Any of those is a reason to open a decision issue.

Storybook's own static build is not a screenshot tool and does not become one
by being retained. Nothing here compares images.

## No Vercel previews

This approach does not use them and must not start. Vercel deploys the
documentation site from the production branch only, and per-branch preview
deployments are switched off deliberately. See
[`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

The Storybook artifact is a GitHub Actions artifact, downloaded and served
locally. It never leaves the repository's own CI.

## The review workflow

1. Open the pull request. The `validate` workflow runs.
2. Open the run's **Summary** page, scroll to **Artifacts**, and download
   `storybook-static-<sha>`.
3. Unzip it, then serve it:

   ```bash
   pnpm review:storybook path/to/unzipped
   ```

   Or, for the build in your own working tree:

   ```bash
   pnpm build:storybook && pnpm review:storybook
   ```

4. Open the stories the change touched. For a component change that is the full
   state matrix in both themes, which the story template already guarantees
   exists. Compare against the same stories on `main`, built the same way.

The artifact must be served over HTTP. Opening `index.html` from the filesystem
gives a blank page: the build loads its runtime as an ES module and fetches
`index.json` at startup, and browsers block both over `file://`. That is what
`pnpm review:storybook` is for, and why it has no dependencies to install.

The upload runs with `if: always()`, so a run that failed a later check still
produces an artifact. A visual regression is often what broke the check, and
withholding the evidence at that moment would be exactly backwards.

## Baselines

**There are no stored baselines, and that is the design.** The comparison is
between two builds: the one on the pull request and the one on `main`.

To update what "correct" looks like, merge the change. There is no baseline
file to approve, no `--update-snapshots`, and no second commit that only blesses
images.

If you want a side-by-side, build both:

```bash
# On main
pnpm build:storybook
cp -R apps/storybook/storybook-static /tmp/storybook-main

# On the branch
pnpm build:storybook
pnpm review:storybook /tmp/storybook-main --port 6098   # in one terminal
pnpm review:storybook                                   # in another
```

Two windows, same story, same theme.

## Triaging a visual difference

Work down this list. Most differences are the third case.

1. **Is it the theme?** Check both. A change that looks right in light and
   wrong in dark usually means a raw value where a semantic token belongs.
2. **Is it a token change?** `pnpm tokens:check` proves the generated artifacts
   match their sources, and `pnpm check:colors` proves the pairings still meet
   contrast. If a token moved, every component using it moved, and the diff is
   correct.
3. **Is it intended?** Say so in the pull request, with the stories affected.
   Intended visual change is normal. Unexplained visual change is the problem.
4. **Is it layout shift from motion?** Motion must use `transform` and
   `opacity`, so it cannot move its neighbours. If neighbours moved, that is a
   defect, not a rendering difference. Check `M7` in
   [`../../MANUAL-REVIEW.md`](../../MANUAL-REVIEW.md).
5. **Is it the platform?** Font rendering and subpixel differences between
   machines are real. This is a reason the approach compares builds rather than
   pixel-diffing images, and it is why a hosted provider needs a triage budget.

A difference you cannot explain blocks the merge until you can. That rule is
the whole value of the approach; without it, the artifact is decoration.

## What this does not cover

- Stories nobody opens. Named above; the accepted cost.
- Anything moving. A static build shows frames, not motion. Motion review is
  `M1` to `M8` in [`../../MANUAL-REVIEW.md`](../../MANUAL-REVIEW.md).
- Rendering in any browser other than the one you open the artifact in.
- Real devices.

## Related

- [`STORY-TEMPLATE.md`](STORY-TEMPLATE.md) for the state matrix this reviews
- [`../../MANUAL-REVIEW.md`](../../MANUAL-REVIEW.md) for the checks a static build cannot show
- [`../docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md) for why there are no preview deployments
- [CI, pnpm workspace, npm registry, and Vercel plan](https://linear.app/wearehaux/document/ci-pnpm-workspace-npm-registry-and-vercel-plan-a52ba74ff7a1)
