import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

/* Static search index built from the same source the pages render from, so a
 * page can never exist without being findable.
 *
 * Search matches only the indexed content documents: one for the title, one
 * for the description, one per heading, one per paragraph. Frontmatter
 * `keywords` become one short document each, because the scoring favours a
 * document that a query matches nearly whole. "dark mode" against a document
 * that reads "dark mode" outranks the same words inside a paragraph, which is
 * what puts Theming above eleven component pages that mention dark mode in
 * passing. One document holding every keyword at once was the opposite: a
 * long document that no query matched well. `scripts/evaluate-search.mjs`
 * measures the result. */
const api = createFromSource(source, {
  buildIndex(page) {
    const keywords = page.data.keywords ?? [];
    const structuredData = page.data.structuredData;

    return {
      id: page.url,
      url: page.url,
      title: page.data.title,
      description: page.data.description,
      structuredData:
        keywords.length === 0
          ? structuredData
          : {
              headings: structuredData.headings,
              contents: [
                ...structuredData.contents,
                ...keywords.map((keyword) => ({ heading: undefined, content: keyword })),
              ],
            },
    };
  },
});

interface SearchResult {
  id: string;
  type: "page" | "heading" | "text";
  url: string;
  /** Markdown with the matched terms wrapped in `<mark>`. */
  content: string;
  breadcrumbs?: string[];
}

/**
 * Pages whose title matches the query come first.
 *
 * The results arrive grouped by page, each group opening with a `page` item
 * whose content is the highlighted title, and groups in index order when their
 * best hits score the same. That tie is common here: every component page has
 * a "Changelog" heading, so "changelog" matched eleven component sections and
 * the Changelog page equally, and the components won on file order. A page
 * named for the term is the page the reader wants, so those groups move to the
 * front, in their original order, and everything else keeps its order.
 */
function titleMatchesFirst(results: SearchResult[]): SearchResult[] {
  const groups: SearchResult[][] = [];
  for (const result of results) {
    if (result.type === "page" || groups.length === 0) groups.push([result]);
    else groups[groups.length - 1]?.push(result);
  }
  const titled = groups.filter((group) => group[0]?.type === "page" && group[0].content.includes("<mark>"));
  const rest = groups.filter((group) => !titled.includes(group));
  return [...titled, ...rest].flat();
}

export async function GET(request: Request): Promise<Response> {
  const response = await api.GET(request);
  const results = (await response.json()) as SearchResult[];
  return Response.json(titleMatchesFirst(results));
}
