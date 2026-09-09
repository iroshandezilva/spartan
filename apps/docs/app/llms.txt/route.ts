import { llms } from "fumadocs-core/source";
import { source } from "@/lib/source";

/* The agent-readable entry point required by the documentation plan: an index
 * of every published page, generated from the page tree rather than
 * maintained by hand, so it cannot fall behind the site. */
export const revalidate = false;

export function GET() {
  return new Response(llms(source).index(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
