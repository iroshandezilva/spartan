# Production branch protection

Required settings for `main`. These cannot be committed to the repository:
GitHub stores them on the repository itself, and applying them needs admin
permission on a repository that exists.

This document is the specification. Iroshan applies it. Until it is applied,
`.github/workflows/validate.yml` reports results but nothing enforces them, so a
red check does not block a merge.

## The required check

| Field | Value |
| --- | --- |
| Workflow file | `.github/workflows/validate.yml` |
| Workflow name | `Validate` |
| Job name, and the string to require | `validate` |

The required status check is matched by the **job** name, not the workflow name.
Requiring `Validate` instead of `validate` silently protects nothing: GitHub
waits for a check that never reports, or the rule matches nothing and merges
proceed. If the job is ever renamed, this setting must be updated in the same
change.

## Settings

Configure through **Settings → Rules → Rulesets**, targeting the default branch.
Classic branch protection is equivalent for these fields if you prefer it.

| Setting | Value | Why |
| --- | --- | --- |
| Target | Default branch (`main`) | The production branch, per HAUX-26. |
| Restrict deletions | Enabled | `main` is the deployment source. |
| Block force pushes | Enabled | Preserves history and keeps a rollback point meaningful. |
| Require a pull request before merging | Enabled | Every change is reviewable. |
| Required approvals | 0 | Single maintainer. Raise this when someone else contributes. |
| Dismiss stale approvals on new commits | Enabled | An approval describes the code it was given for. |
| Require conversation resolution | Enabled | Review comments cannot be merged past silently. |
| Require status checks to pass | Enabled | The point of this issue. |
| Required check | `validate` | Exactly as spelled above. |
| Require branches to be up to date | Enabled | Prevents two individually green branches merging into a broken `main`. |
| Require linear history | Enabled | Squash or rebase merges only. Keeps rollback targets legible. |
| Allow bypass | No actors | A bypass list makes the rule advisory. |

Leave **Require signed commits** off unless commit signing is set up first, or
every unsigned commit is blocked including your own.

## Verification

Run after applying, and record the result on HAUX-29.

1. Push a branch with a deliberate failure, for example a formatting violation,
   and open a pull request.
2. Confirm the `validate` check runs and fails.
3. Confirm the merge button is blocked, and that the reason names the failed
   check rather than a generic message.
4. Push a fix to the same branch.
5. Confirm `validate` reruns and passes, and the merge button unblocks.
6. Confirm the run's Summary page lists the `package-tarball` artifact.
7. Confirm the failing step is identifiable from the checks UI without opening
   the raw log.

Step 3 is the acceptance criterion. A check that reports red but still allows a
merge is the failure this document exists to prevent.

## Not covered here

- Publishing credentials and the release workflow: HAUX-60, recorded in
  [`RELEASE.md`](RELEASE.md) and `workflows/release.yml`. No secret belongs in
  the validation workflow, and none exists in the release workflow either.
- Storybook and docs static-build artifacts: HAUX-39 and HAUX-54, once those
  workspaces produce static builds.
- The packed-artifact consumer smoke test: HAUX-59.
