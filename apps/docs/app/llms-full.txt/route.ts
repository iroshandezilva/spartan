import { markdownComponents } from "@/lib/llm-markdown";
import { llmsFullPreamble, pagesInTreeOrder } from "@/lib/llms";
import { getLLMText } from "@/lib/source";

/* Every page as one Markdown document, for an agent that would rather read the
 * whole system than crawl it. Pages come in navigation order, and the tables
 * the site generates at build time are rendered into the text through the
 * Markdown components. */
export const revalidate = false;

export async function GET() {
  const pages = pagesInTreeOrder();
  const text = await Promise.all(pages.map((page) => getLLMText(page, markdownComponents)));

  return new Response(llmsFullPreamble(pages.length) + text.join("\n\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
