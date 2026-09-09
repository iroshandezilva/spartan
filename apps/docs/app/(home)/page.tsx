import Link from "next/link";
import { ButtonRow } from "@/components/demo/ButtonRow";
import { docsRoute, packageName, siteDescription, siteName } from "@/lib/shared";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-heading-large font-semibold tracking-heading text-foreground">
          {siteName}
        </h1>
        <p className="text-body-large text-foreground-muted">{siteDescription}</p>
        <p className="text-body-small text-foreground-muted">
          <code className="rounded-control bg-surface-muted px-1.5 py-0.5 font-mono">
            {packageName}
          </code>
        </p>
      </div>

      {/* Live components, not a screenshot. If the package export breaks, this
          page fails to build. */}
      <ButtonRow />

      <p className="text-body text-foreground-muted">
        <Link className="font-medium text-primary-text underline" href={docsRoute}>
          Read the documentation
        </Link>{" "}
        for installation, theming, and foundations.
      </p>
    </main>
  );
}
