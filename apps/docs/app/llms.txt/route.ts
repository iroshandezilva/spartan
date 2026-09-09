import { llmsIndex } from "@/lib/llms";

/* The agent-readable entry point required by the documentation plan: an index
 * of every published page with agent guidance, commands, and stable source
 * paths, generated from the page tree rather than maintained by hand, so it
 * cannot fall behind the site. */
export const revalidate = false;

export function GET() {
  return new Response(llmsIndex(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
