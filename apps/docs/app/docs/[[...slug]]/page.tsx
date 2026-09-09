import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { pageMetadata } from "@/lib/shared";
import { source } from "@/lib/source";

interface PageParams {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page(props: PageParams) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    /*
     * `id="content"` is the skip link's target; the root layout owns the link.
     *
     * Both tables of contents become named navigation landmarks, which is what
     * a table of contents is. Without this the wide-viewport one is a bare
     * `div` outside every landmark, and the narrow-viewport popover is a
     * `header`, which outside sectioning content is a second banner beside
     * the site header. The two names differ only so that an audit which sees
     * both at once (no layout engine, nothing hidden) can tell them apart; a
     * reader only ever meets one at a time.
     */
    <DocsPage
      id="content"
      toc={page.data.toc}
      full={page.data.full}
      tableOfContent={{
        container: { role: "navigation", "aria-labelledby": "toc-title" },
      }}
      tableOfContentPopover={{
        container: { role: "navigation", "aria-label": "Table of contents" },
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            /* Lets a page link to another by its file path on disk, which is
             * what survives a page being moved. */
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

/* Every page is known at build time, so a slug that is not in the list is a
 * 404 at the router, which serves the prerendered not-found page inside the
 * root layout. Left at the default, Next would render the page on demand,
 * and a notFound() thrown from that render comes back as Next's bare error
 * shell: no lang, no skip link, no navigation. */
export const dynamicParams = false;

export async function generateMetadata(props: PageParams): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  /* No notFound() here. A notFound() thrown while resolving metadata makes
   * Next render the 404 in its bare error shell, without the root layout,
   * so the page has no lang, no skip link, and no navigation. The page
   * component throws instead, which reaches app/not-found.tsx inside the
   * layout. app/not-found.tsx sets the title for that case. */
  if (!page) return {};

  return pageMetadata({
    title: page.data.title,
    description: page.data.description ?? "",
    path: page.url,
  });
}
