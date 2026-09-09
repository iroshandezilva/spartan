/**
 * Runs every site check against one served build: the link crawl, the search
 * evaluation, and the accessibility audit. Fails if any of them does.
 *
 *   node scripts/check-site.mjs [--base URL]
 */

import { audit } from "./audit-a11y.mjs";
import { crawl } from "./crawl-links.mjs";
import { evaluate } from "./evaluate-search.mjs";
import { runIfMain, withSite } from "./lib/site.mjs";

export async function checkSite(base) {
  const results = [];
  for (const [name, check] of [
    ["links", crawl],
    ["search", evaluate],
    ["a11y", audit],
  ]) {
    console.log(`\n=== ${name}\n`);
    results.push([name, await check(base)]);
  }
  console.log("");
  for (const [name, ok] of results) console.log(`${name}: ${ok ? "pass" : "fail"}`);
  return results.every(([, ok]) => ok);
}

runIfMain(import.meta.url, (options) => withSite(options, checkSite));
