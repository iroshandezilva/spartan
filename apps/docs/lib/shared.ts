/** Values used by more than one route or layout. Kept in one place so the
 * navigation shell, metadata, and the machine-readable entry points cannot
 * disagree about what this site is called or where its content lives. */

export const siteName = "Spartant";

export const siteDescription =
  "Code-first React design system for building consistent product prototypes.";

/** Base URL of the documentation section. */
export const docsRoute = "/docs";

/** npm package the documentation describes. */
export const packageName = "@iroshandezilva/spartant";

/** The public repository. Stable source paths in the documentation are links into it. */
export const repositoryUrl = "https://github.com/iroshandezilva/spartan";

/** A repository file or directory on the production branch. */
export function repositoryFileUrl(path: string): string {
  const kind = path.endsWith("/") ? "tree" : "blob";
  return `${repositoryUrl}/${kind}/main/${path}`;
}

/**
 * The site's canonical origin, without a trailing slash, or an empty string
 * when it is not configured. It comes from `NEXT_PUBLIC_SITE_URL`, which
 * `DEPLOYMENT.md` records as the one required value and which HAUX-64 sets on
 * the production project. While it is empty, the machine-readable entry
 * points link pages by path, which is correct relative to wherever the file
 * was fetched from.
 */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

/** A site path as an absolute URL when the origin is known, else the path itself. */
export function absoluteUrl(path: string): string {
  return `${siteUrl}${path}`;
}
