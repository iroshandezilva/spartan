import { loader } from "fumadocs-core/source";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineDocs } from "fumadocs-mdx/macro";
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
      /* Keeps the rendered Markdown available to the llms.txt routes. */
      includeProcessedMarkdown: true,
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

/** One page rendered as plain Markdown, prefixed with its title and URL so a
 * coding agent reading the concatenated output can tell pages apart. */
export async function getLLMText(page: DocsPageData): Promise<string> {
  const processed = await page.data.getText("processed");

  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
