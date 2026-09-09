# Vercel deployment policy

Approved policy for hosting the Spartant documentation site. It defines what
deploys, what must never deploy, which environment values exist, how a
deployment is verified, and how it is rolled back.

This document defines the policy. It does not apply it. Connecting the Vercel
project, applying these settings, and going live are HAUX-64.

## Principle

Only the production branch produces a deployment. Nothing else does.

The goal is a documentation site that is always current with the released
package, without spending a deployment on every branch and without a scatter of
stale preview URLs that can be mistaken for the real thing.

## Production branch

`main`, confirmed in HAUX-26 and recorded in the project brief and the
architecture document.

A commit on `main` produces exactly one **Production** deployment. No other
branch, tag, or pull request produces any deployment of any kind.

## Ignored Build Step

Every build Vercel starts runs the Ignored Build Step first. It decides whether
the build continues.

Set **Project Settings → Git → Ignored Build Step** to:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "main" ]; then exit 1; else exit 0; fi
```

The exit codes are inverted from the usual convention, which is the single
easiest thing to get backwards here:

| Exit code | Meaning |
| --- | --- |
| `1` | Continue the build. Used for `main`. |
| `0` | Cancel the build. Used for everything else. |

A canceled build consumes no build minutes and produces no URL.

`VERCEL_GIT_COMMIT_REF` is the branch name Vercel is building. Do not switch
this check to `VERCEL_ENV`: that reports `preview` for every non-production
build regardless of branch, so it cannot distinguish `main` from anything else
if the Production Branch setting is ever changed.

### Not a substitute for the setting

Turning previews off is the Ignored Build Step's job, not a `vercel.json`
concern. Deploy Hooks and manual redeploys bypass branch checks entirely, so
neither may be configured for non-production branches.

## No per-branch previews

The policy explicitly excludes:

- Preview deployments for feature branches.
- Preview deployments for pull requests, including the Vercel bot's PR comment.
- Deploy Hooks pointing at any branch other than `main`.
- Any automation that redeploys a non-production commit.

This is a deliberate constraint from the project brief's v0.1 exclusions, not an
optimization to revisit casually. Reviewers read Storybook's CI artifact and run
the docs site locally with `pnpm --filter spartant-docs dev`. Neither needs a
hosted preview.

Changing this requires a Linear decision issue and an update to the architecture
document.

## Environment values

Classify every value before adding it. The classification decides where it may
live and who may see it.

| Class | Where it lives | Visible in the browser | Rule |
| --- | --- | --- | --- |
| Public build-time | Vercel, Production scope, `NEXT_PUBLIC_` prefix | Yes | Only non-sensitive values. Assume anyone can read it. |
| Private build-time | Vercel, Production scope, no `NEXT_PUBLIC_` prefix | No | Available while building. Never sent to the client. |
| Private runtime | Vercel, Production scope, no `NEXT_PUBLIC_` prefix | No | Server-side only. |
| Local development | `.env.local`, gitignored | Depends on prefix | Never committed. Never mirrored into Vercel. |

Rules:

- A private value must never carry the `NEXT_PUBLIC_` prefix. That prefix inlines
  the value into the client bundle at build time, and a bundle cannot be
  un-shipped.
- No secret, token, or credential is committed to this repository, in any form,
  including examples and screenshots.
- The **Preview** environment scope stays empty, because previews are disabled.
  Populating it implies previews exist.
- Adding a value means adding a row to the table below in the same change.

### Required values

| Name | Class | Purpose | Status |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Public build-time | Canonical origin for metadata, `sitemap.xml`, and Open Graph URLs | Set during HAUX-64 to the Vercel production URL |

The documentation site is static content built from this repository. It needs no
database, no API key, and no runtime secret. If that stops being true, the change
belongs in its own issue with a stated reason, not a quiet addition here.

## Intended project settings

Applied in HAUX-64, recorded here so the settings are reviewable before anyone
clicks anything.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Root Directory | `apps/docs` |
| Include files outside the root directory | Enabled, because the app consumes the workspace package |
| Install Command | `pnpm install --frozen-lockfile` |
| Build Command | `pnpm --filter @iroshandezilva/spartant build && pnpm --filter spartant-docs build` |
| Production Branch | `main` |
| Ignored Build Step | The command above |
| Deploy Hooks | None |
| Custom domain | None for the first release. Deferred by HAUX-26 to HAUX-64. |

HAUX-54 landed the real Fumadocs application, so these rows are no longer
provisional. The build command gained a step: this app imports the package's
compiled stylesheet, so the package has to be built before the site is. The
`--filter` form is used rather than the root `pnpm build:docs` script because
Vercel runs the build with `apps/docs` as the working directory, where the root
script is not in scope. Both filters resolve from anywhere inside the workspace.

Confirming this against a real Vercel project is HAUX-64's work, not a claim
made here.

## Verification

Executed in HAUX-64. Defined here so the launch issue has a checklist rather
than an improvisation.

### Feature branch, proving nothing deploys

1. Push a commit to any branch other than `main`.
2. In the Vercel dashboard, confirm a build appears and is marked canceled by the
   Ignored Build Step.
3. Confirm no deployment URL was produced.
4. Open a pull request from that branch and confirm no Vercel comment or status
   check appears on it.
5. Confirm the project's Deployments list has gained no new entry that serves
   traffic.

A preview URL appearing at any point is a policy failure, not a surprise to work
around.

### Production, proving the right thing deploys

1. Merge to `main`.
2. Confirm exactly one Production deployment starts.
3. Confirm the build log shows the Ignored Build Step continuing, then
   `pnpm install --frozen-lockfile`, then the docs build.
4. Confirm the production URL serves the site.
5. Confirm canonical metadata, `sitemap.xml`, and the error routes resolve.
6. Confirm no private value appears in the client bundle.
7. Record the deployment ID as the known-good rollback target.

## Rollback

1. Open the Vercel project's Deployments list.
2. Select the last known-good Production deployment.
3. Use **Instant Rollback**, or promote that deployment to Production.
4. Confirm the production URL serves the restored build.
5. Open a Linear issue describing what broke, before starting a fix.

Rollback restores a previously built artifact. It does not change the repository,
so a bad commit on `main` still needs a revert or a forward fix. Roll back first,
then fix; do not leave production broken while debugging.

Rollback is Iroshan's action. It requires Vercel access that agents do not have.

## Ownership

Iroshan owns the Vercel project, its settings, its environment values, and every
deployment and rollback action.

A coding agent may propose changes to this document through a Linear issue. An
agent must not create or modify a Vercel project, change project settings, set
environment values, trigger a deployment, or perform a rollback. Work that needs
those permissions stops and asks, per the stop conditions in `AGENTS.md`.

## Out of scope here

- Connecting the Vercel project and going live: HAUX-64.
- The custom documentation domain: deferred by HAUX-26, revisited in HAUX-64.
- GitHub Actions validation and branch protection: HAUX-29.
- Creating the Fumadocs application: HAUX-54, complete.
