import { createFromSource } from "fumadocs-core/search/server";
import { source } from "@/lib/source";

/* Static search index built from the same source the pages render from, so a
 * page can never exist without being findable.
 *
 * Frontmatter `keywords` are appended to the indexed content, so a search for
 * a token name, a prop, or an error term lands on the page that declares it
 * even when the body never spells the term out that way. */
export const { GET } = createFromSource(source, {
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
                { heading: undefined, content: keywords.join(", ") },
              ],
            },
    };
  },
});
