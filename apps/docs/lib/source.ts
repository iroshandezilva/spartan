import { loader } from "fumadocs-core/source";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";
import type { MDXComponents } from "mdx/types";
import { docsRoute } from "./shared";

/*
 * Content collection. `defineDocs` is a build-time macro: fumadocs-mdx reads
 * this call during the Next build and generates the typed collection from
 * content/docs, so the frontmatter shape here is what the pages are checked
 * against.
 *
 * `keywords` is added to the stock page schema so search terms can live in
 * frontmatter and reach the search index. The field type is derived from the
 * stock schema's own string type rather than from a zod import, because zod is
 * not a dependency of this app.
 */
const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema.extend({
      keywords: pageSchema.shape.title.array().optional(),
    }),
    postprocess: {
      /* Keeps the rendered Markdown available to the llms.txt routes. The
       * function form keeps every JSX element with its real props, so the
       * generated tables can be rendered into the text through the Markdown
       * components in lib/llm-markdown.ts instead of being left as tags. */
      includeProcessedMarkdown: { output: "function" },
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
});

export type DocsPageData = (typeof source)["$inferPage"];

/**
 * One page rendered as plain Markdown, prefixed with its title and URL so a
 * coding agent reading the concatenated output can tell pages apart.
 *
 * Links that the MDX writes as file paths, such as `../foundations/motion.mdx`,
 * are resolved to the page URLs the site serves, the same way
 * `createRelativeLink` resolves them on the rendered page, and same-page
 * fragment links gain their page. A text reader has no file system, and no
 * current page, to resolve them against.
 */
export async function getLLMText(page: DocsPageData, components?: MDXComponents): Promise<string> {
  const processed = await page.data.getText("processed", { components });
  const resolved = processed
    .replace(/\]\((\.{1,2}\/[^)\s]+\.mdx(?:#[^)\s]*)?)\)/g, (_, href) => {
      return `](${source.resolveHref(href, page)})`;
    })
    /* A same-page fragment link, `[Anatomy](#anatomy)`, points nowhere once
     * every page is one document. Prefix it with the page it belongs to. */
    .replace(/\]\(#([^)\s]+)\)/g, (_, hash) => `](${page.url}#${hash})`);

  return `# ${page.data.title} (${page.url})\n\n${resolved}`;
}
