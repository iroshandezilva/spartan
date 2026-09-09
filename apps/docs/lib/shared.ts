import type { Metadata } from "next";

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

/** Where `pnpm dev:docs` and `pnpm --filter spartant-docs start` serve the site. */
const localOrigin = "http://localhost:3100";

/**
 * The origin the site is served from, when it is known, without a trailing
 * slash. Resolved once, at build time, in this order:
 *
 * 1. `NEXT_PUBLIC_SITE_URL`, the one required value in `DEPLOYMENT.md`, set
 *    on the production project by HAUX-64.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel exposes to every build of
 *    a project. Only the production branch builds, so it is the production
 *    origin. It exists so a build never ships `localhost` in its sitemap
 *    because a dashboard value was forgotten.
 * 3. Nothing. A local build has no origin to claim.
 */
function configuredOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;

  return "";
}

/** The configured origin, or an empty string while none is configured. */
export const siteOrigin = configuredOrigin();

/**
 * The origin used wherever a URL has to be absolute: `metadataBase`,
 * `sitemap.xml`, `robots.txt`, and Open Graph. Falls back to the local
 * development origin, which is right for a build that is only ever served
 * locally and is visibly wrong, rather than subtly wrong, anywhere else.
 */
export const siteUrl = siteOrigin || localOrigin;

/**
 * A site path as an absolute URL when the origin is configured, else the path
 * itself. Used by the machine-readable entry points, where a relative path is
 * correct against wherever the file was fetched from and a guessed origin
 * would not be.
 */
export function absoluteUrl(path: string): string {
  return `${siteOrigin}${path}`;
}

interface PageMetadataOptions {
  title: string;
  description: string;
  /** Site-relative path, which becomes the canonical URL and the Open Graph URL. */
  path: string;
  type?: "website" | "article";
}

/**
 * The per-page metadata every route declares the same way: title,
 * description, canonical, and the Open Graph basics. Next merges `openGraph`
 * by replacement rather than by field, so the whole object is built here to
 * keep the site name and locale on every page.
 */
export function pageMetadata({
  title,
  description,
  path,
  type = "article",
}: PageMetadataOptions): Metadata {
  const fullTitle = title === siteName ? siteName : `${title} · ${siteName}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName,
      locale: "en",
      title: fullTitle,
      description,
      url: path,
    },
  };
}
