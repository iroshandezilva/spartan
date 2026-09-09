# Releasing to the npm registry

How `@iroshandezilva/spartant` reaches the registry, and what has to exist
outside this repository for that to work. Decided in HAUX-60. The workflow is
[`workflows/release.yml`](workflows/release.yml); this file is the part of the
configuration that lives on npmjs.com and on GitHub, which cannot be committed,
plus the runbook.

The principles, which are settled decisions and not open for re-litigation:

- pnpm installs, validates, builds, tests, packs, and smoke-tests the release.
  The npm CLI runs exactly once, for `npm publish`, because the registry's
  OIDC flow requires it.
- There is no long-lived registry token. Not in repository secrets, not in an
  environment secret, not in `.npmrc`. Trusted publishing replaces it, and the
  workflow refuses to run if it finds one.
- Releases come from `main` only. A tag on an unmerged commit is rejected.
- Provenance is published for every release. It is automatic with trusted
  publishing; the workflow also passes `--provenance` so the intent is explicit.
- Nothing publishes from a laptop.

## What must exist first

These are prerequisites the repository cannot satisfy on its own. They are the
human actions recorded on HAUX-60 and must happen in this order.

### 1. The GitHub repository

The working directory is not yet a Git repository and no GitHub repository
exists. Creating the public repository and pushing `main` is Iroshan's action;
no agent may do it without explicit approval. The branch protection in
[`BRANCH_PROTECTION.md`](BRANCH_PROTECTION.md) applies at the same time.

### 2. The repository fields in the package manifest

`packages/spartant/package.json` deliberately has no `repository`, `homepage`,
or `bugs` field. Inventing a URL would have broken provenance, and trusted
publishing checks that `repository.url` matches the GitHub repository exactly.
Add all three in the same change that creates the repository, before any
publish, in this shape with the real owner and name:

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/iroshandezilva/spartan.git",
  "directory": "packages/spartant"
},
"homepage": "https://github.com/iroshandezilva/spartan#readme",
"bugs": "https://github.com/iroshandezilva/spartan/issues"
```

`directory` matters: the package lives in a workspace subdirectory, and
provenance records that path. Once the fields exist, the `EXPECTED` contract in
[`../scripts/inspect-package.mjs`](../scripts/inspect-package.mjs) may also
assert them, so a later edit cannot drop or misspell them without failing
`pnpm inspect:package`. Update
[`../packages/spartant/VERSIONING.md`](../packages/spartant/VERSIONING.md),
which currently records the fields as not set, in the same change.

### 3. The trusted publisher on npmjs.com

Configured on the package's settings page, in the Trusted Publisher section.
Every field must match the workflow exactly; a mismatch produces an
authentication failure at publish time with no other symptom.

| Field | Value |
| --- | --- |
| Package | `@iroshandezilva/spartant` |
| Publisher | GitHub Actions |
| Organization or user | The GitHub owner of the repository, exactly as it appears in the URL |
| Repository | The repository name, exactly as it appears in the URL |
| Workflow filename | `release.yml` |
| Environment name | `npm-release` |
| Allowed actions | Allow `npm publish`. Configurations created after 3 September 2026 allow only `npm stage publish` by default, which would leave every release parked on npmjs.com awaiting a second approval. The GitHub environment below is the approval gate for this project, so the direct publish must be permitted |

The filename is the file's own name, not the workflow's `name:` value and not
a path. The environment name is required here even though npm marks it
optional: without it, any workflow file of that name in the repository could
publish, and the environment's required reviewer would protect nothing.

A package that has never been published has no settings page. If npmjs.com
does not offer a way to register the publisher for a new name, the first
publish of `0.1.0` needs one of two paths, and Iroshan chooses: publish a
first version through the staged flow, or accept a one-time manual first
publish from a logged-in session and configure the trusted publisher
immediately after. Neither path stores a token in this repository. Record the
choice on HAUX-63.

### 4. The `npm-release` environment on GitHub

Settings, Environments, New environment, named exactly `npm-release`.

| Setting | Value | Why |
| --- | --- | --- |
| Required reviewers | Iroshan | Every publish waits for a person to approve the job. This is the release approval |
| Prevent self-review | Off | Single maintainer; the reviewer is also the author |
| Wait timer | 0 | The reviewer is the delay |
| Deployment branches and tags | Selected branches and tags: `main` and the pattern `v*` | The workflow already proves the commit is on `main`; this is the second lock |
| Environment secrets | None | There is nothing to store. Adding a token here would defeat the design |
| Environment variables | None | |

No repository secret named `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or similar may be
created. The workflow unsets those names and fails if an `_authToken` line
exists in any `.npmrc` it can see.

## Runbook

From merged changes to a verified package page.

1. **Prepare.** On a branch from `main`, run `pnpm release:plan` to see the
   proposed version and changelog section, then `pnpm release:prepare`. It
   bumps the manifest, writes the dated section in
   [`../CHANGELOG.md`](../CHANGELOG.md), rewrites every `spartant-version`
   marker, deletes the consumed notes, and writes the pull request body to
   `.artifacts/release-<version>.md`. Commit and open the pull request with the
   commands it prints. The format and the version rules are in
   [`../.changes/README.md`](../.changes/README.md).
2. **Merge.** The release pull request passes `validate` like any other. Review
   the changelog as a consumer would read it.
3. **Tag.** On the merged commit on `main`:

   ```
   git switch main && git pull
   git tag v<version>
   git push origin v<version>
   ```

   The tag must be `v` plus the manifest version. The workflow fails on any
   other tag.
4. **Approve.** The `release` job pauses at the `npm-release` environment.
   Approve it from the run page. Everything before publish has already run at
   that point: `pnpm validate`, `pnpm release:check --strict`, the consumer
   smoke test, and the package inspection.
5. **Verify.** The run summary links the published version. Check the package
   page as described below, then install it in a clean project outside this
   repository: `pnpm add @iroshandezilva/spartant@<version>` and import the
   entry point and `styles.css`.
6. **Record.** Comment the version, the run URL, and the verification result
   on the release issue. For the first release that is HAUX-63.

### Rehearsal before the first release

The issue requires a dry run or prerelease path before the approved first
publish. Both exist.

- **Dry run.** Run the workflow manually from `main` (Actions, Release, Run
  workflow). A manual run is always a rehearsal: it executes every gate and
  ends with `npm publish --dry-run`, which packs and reports what would be
  sent without contacting the registry for a credential. It proves the
  pipeline, not the OIDC exchange.
- **Prerelease.** Prepare a version such as `0.1.0-rc.1` with
  `pnpm release:prepare --version=0.1.0-rc.1`, merge, and tag it. A version
  containing a hyphen publishes under the `next` dist-tag, so it never becomes
  `latest`. This proves the OIDC exchange, provenance, and the package page end
  to end. It is the recommended rehearsal once the trusted publisher exists.

## What to check on the package page

`https://www.npmjs.com/package/@iroshandezilva/spartant`

- **Version.** The header shows the version just published, and the Versions
  tab lists it under `latest` (or `next` for a prerelease).
- **Provenance.** The sidebar shows the Provenance badge, and expanding it names
  the GitHub repository, the `release.yml` workflow, and the commit. A missing
  badge means the publish did not go through trusted publishing, which is a
  release defect to investigate before anything else is published.
- **Install command.** `npm i @iroshandezilva/spartant` is shown; use
  `pnpm add @iroshandezilva/spartant` locally.
- **Repository link.** The sidebar links to the GitHub repository. It comes
  from the `repository` field; if it is absent, step 2 above was skipped.
- **Files.** The Code tab shows `dist/`, `package.json`, `README.md`, and
  `LICENSE`, and nothing else. This is the same list
  `pnpm inspect:package` enforces.

## When a publish fails

The job's diagnostics step prints the event, ref, commit, package version, tool
versions, whether the OIDC endpoint was present, and the count of token
environment variables (which must be 0), then the tail of the npm debug log
with any bearer or token value redacted. The same files are uploaded as the
`release-diagnostics-<run id>` artifact. Nothing in that output is secret,
because nothing in the job is.

| Symptom | Likely cause |
| --- | --- |
| Fails at "Confirm the commit is on main" | The tag points at a commit that was never merged. Merge first, tag the merge commit |
| Fails at "Confirm the version, tag, and pending notes" | Tag and manifest version disagree, or a release note was merged after `release:prepare`. Prepare again |
| Fails in `pnpm validate` or the smoke test | A normal defect; fix on a branch, merge, tag the new commit |
| `npm publish` returns 401 or 404 with the OIDC endpoint present | The trusted publisher on npmjs.com does not match: owner, repository, `release.yml`, or `npm-release` differs, or the `repository.url` field does not match the repository |
| `npm publish` returns 403 mentioning a stage | The trusted publisher allows only `npm stage publish`. Change Allowed actions |
| OIDC endpoint absent | The `id-token: write` permission was removed, or the job is not running on a GitHub-hosted runner |
| A token environment variable count above 0 | Someone added a secret. Remove it; the design does not use one |

A failed run publishes nothing, so re-running after the fix is safe. A version
that did reach the registry cannot be re-published; bump with a patch note and
release again.

## Rolling back

The registry does not allow replacing a published version. If a release is
defective, `npm deprecate @iroshandezilva/spartant@<version> "<reason>"` from
a logged-in session marks it, and a patch release carries the fix. Unpublishing
is limited to 72 hours and breaks anyone who already installed; do not rely on
it.
