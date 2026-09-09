import { getLLMText, source } from "@/lib/source";

/* Every page as one Markdown document, for an agent that would rather read the
 * whole system than crawl it. */
export const revalidate = false;

export async function GET() {
  const pages = await Promise.all(source.getPages().map(getLLMText));

  return new Response(pages.join("\n\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
