import { HomeLayout } from "fumadocs-ui/layouts/home";
import type { Metadata } from "next";
import Link from "next/link";
import { baseOptions } from "@/lib/layout.shared";
import { docsRoute } from "@/lib/shared";

/* Rendered for any path that no route claims, including a documentation slug
 * that `source.getPage` cannot find. It answers with a real 404 status and the
 * site's own shell, so a reader who followed a stale link keeps the search,
 * the theme, and a way back. Not indexed: an error page is not content. */
export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

const places = [
  { href: docsRoute, label: "Introduction" },
  { href: `${docsRoute}/start/installation`, label: "Installation" },
  { href: `${docsRoute}/components/button`, label: "Components" },
  { href: `${docsRoute}/start/coding-agents`, label: "Using with a coding agent" },
];

export default function NotFound() {
  return (
    <HomeLayout {...baseOptions()}>
      <div
        id="content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-6 py-16"
      >
        <div className="flex flex-col gap-3">
          <p className="text-caption font-medium text-foreground-muted">404</p>
          <h1 className="text-heading-large font-semibold tracking-heading text-foreground">
            Page not found
          </h1>
          <p className="text-body-large text-foreground-muted">
            There is no page at this address. The link may be out of date, or the page may have
            moved when the documentation was reorganised.
          </p>
        </div>
        <nav aria-label="Places to go instead">
          <ul className="flex flex-col gap-2 text-body">
            {places.map((place) => (
              <li key={place.href}>
                <Link className="font-medium text-primary-text underline" href={place.href}>
                  {place.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-body-small text-foreground-muted">
          Or search: press{" "}
          <kbd className="rounded-control bg-surface-muted px-1.5 py-0.5 font-mono">⌘K</kbd> or{" "}
          <kbd className="rounded-control bg-surface-muted px-1.5 py-0.5 font-mono">Ctrl K</kbd>.
        </p>
      </div>
    </HomeLayout>
  );
}
