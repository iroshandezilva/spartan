/**
 * Crawls the served site and proves that every internal link resolves and
 * every anchor exists.
 *
 * Starts from the home page, the documentation index, `sitemap.xml`,
 * `robots.txt`, and the two machine-readable text files, follows every
 * same-site link it finds, and records four kinds of failure: a link whose
 * target does not return 200, a fragment whose id is not on the target page,
 * a page missing the metadata the launch requires (title, description,
 * canonical, Open Graph title), and an error route that does not behave as an
 * error route. External links are counted but not fetched: the repository
 * links are checked by shape in the root `check:docs`, and a network failure
 * is not a documentation failure.
 *
 *   node scripts/crawl-links.mjs [--base URL]
 */

import { Window } from "happy-dom";
import { printTable, runIfMain, withSite } from "./lib/site.mjs";

const SEEDS = ["/", "/docs", "/sitemap.xml", "/robots.txt", "/llms.txt", "/llms-full.txt"];
const MISSING_PAGE = "/docs/this-page-does-not-exist";

/** Markdown inline links, ignoring image embeds. */
const MARKDOWN_LINK = /(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g;

function newWindow(url) {
  return new Window({
    url,
    settings: {
      disableJavaScriptFileLoading: true,
      disableJavaScriptEvaluation: true,
      disableCSSFileLoading: true,
    },
  });
}

/** Whether `href` points at this site. `origins` holds every origin the site calls itself. */
function classify(href, pageUrl, origins) {
  if (/^(mailto|tel|javascript):/i.test(href)) return null;
  let url;
  try {
    url = new URL(href, pageUrl);
  } catch {
    return { kind: "malformed" };
  }
  if (!origins.has(url.origin)) return { kind: "external", url };
  return {
    kind: "internal",
    path: url.pathname,
    hash: url.hash ? decodeURIComponent(url.hash.slice(1)) : "",
  };
}

export async function crawl(base) {
  const origins = new Set([base]);
  const pages = new Map();
  const references = [];
  const failures = [];
  const queue = [...SEEDS];
  let external = 0;

  const enqueue = (path) => {
    if (!pages.has(path)) {
      pages.set(path, undefined);
      queue.push(path);
    }
  };

  const recordLinks = (fromPath, pageUrl, hrefs) => {
    for (const href of hrefs) {
      const link = classify(href, pageUrl, origins);
      if (!link) continue;
      if (link.kind === "malformed") {
        failures.push(`${fromPath}: malformed link ${href}`);
      } else if (link.kind === "external") {
        external += 1;
      } else {
        references.push({ from: fromPath, path: link.path, hash: link.hash, href });
        enqueue(link.path);
      }
    }
  };

  while (queue.length > 0) {
    const path = queue.shift();
    const url = `${base}${path}`;
    const response = await fetch(url, { redirect: "manual" });
    const type = response.headers.get("content-type") ?? "";
    const record = { status: response.status, ids: new Set(), type };
    pages.set(path, record);
    if (response.status !== 200) continue;

    const body = await response.text();

    if (type.includes("text/html")) {
      const window = newWindow(url);
      window.document.write(body);
      const { document } = window;

      for (const element of document.querySelectorAll("[id]")) record.ids.add(element.id);
      for (const anchor of document.querySelectorAll("a[name]"))
        record.ids.add(anchor.getAttribute("name"));

      /* The site's own idea of its origin, from the canonical link, so links
       * written with the configured site URL count as internal even when the
       * check runs against localhost. */
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
      if (canonical) {
        try {
          origins.add(new URL(canonical).origin);
        } catch {
          failures.push(`${path}: canonical is not an absolute URL: ${canonical}`);
        }
      }

      const hrefs = [
        ...[...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
        ...[...document.querySelectorAll('link[rel="canonical"], link[rel="icon"]')].map((l) =>
          l.getAttribute("href"),
        ),
        ...[...document.querySelectorAll("img[src]")].map((img) => img.getAttribute("src")),
      ];
      recordLinks(path, url, hrefs);

      const required = {
        title: document.querySelector("title")?.textContent?.trim(),
        description: document.querySelector('meta[name="description"]')?.getAttribute("content"),
        canonical,
        "og:title": document.querySelector('meta[property="og:title"]')?.getAttribute("content"),
        "og:description": document
          .querySelector('meta[property="og:description"]')
          ?.getAttribute("content"),
        "og:url": document.querySelector('meta[property="og:url"]')?.getAttribute("content"),
        lang: document.documentElement.getAttribute("lang"),
        h1: document.querySelector("h1")?.textContent?.trim(),
        "skip link": document.querySelector('a[href="#content"]') ? "yes" : "",
        "skip target": document.getElementById("content") ? "yes" : "",
      };
      for (const [name, value] of Object.entries(required)) {
        if (!value) failures.push(`${path}: missing ${name}`);
      }
      await window.happyDOM.close();
    } else if (type.includes("xml")) {
      const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
      if (locs.length === 0) failures.push(`${path}: no <loc> entries`);
      for (const loc of locs) {
        try {
          origins.add(new URL(loc).origin);
        } catch {
          failures.push(`${path}: <loc> is not an absolute URL: ${loc}`);
        }
      }
      recordLinks(path, url, locs);
    } else if (type.includes("text/plain")) {
      const hrefs = [...body.matchAll(MARKDOWN_LINK)].map((m) => m[1]);
      if (path === "/robots.txt") {
        const sitemap = body.match(/^Sitemap:\s*(\S+)/im)?.[1];
        if (!sitemap) failures.push(`${path}: no Sitemap line`);
        else hrefs.push(sitemap);
      }
      recordLinks(path, url, hrefs);
    }
  }

  let anchors = 0;
  for (const reference of references) {
    const target = pages.get(reference.path);
    if (target?.status !== 200) {
      failures.push(
        `${reference.from}: ${reference.href} -> ${reference.path} returned ${target?.status ?? "nothing"}`,
      );
      continue;
    }
    if (reference.hash) {
      anchors += 1;
      if (!target.ids.has(reference.hash)) {
        failures.push(
          `${reference.from}: ${reference.href} -> no element with id "${reference.hash}" on ${reference.path}`,
        );
      }
    }
  }

  /* The error route. A missing page must answer 404 with the site's own page,
   * not a blank default, and must still carry the shell a reader can leave by. */
  const missing = await fetch(`${base}${MISSING_PAGE}`);
  const missingBody = await missing.text();
  if (missing.status !== 404) failures.push(`${MISSING_PAGE}: expected 404, got ${missing.status}`);
  if (!/Page not found/.test(missingBody))
    failures.push(`${MISSING_PAGE}: not the site's own not-found page`);
  if (!/href="\/docs"/.test(missingBody))
    failures.push(`${MISSING_PAGE}: no way back to the documentation`);

  const html = [...pages.values()].filter((p) => p?.type.includes("text/html")).length;
  printTable(
    ["Measure", "Count"],
    [
      ["Pages fetched", String(pages.size)],
      ["HTML pages", String(html)],
      ["Internal links checked", String(references.length)],
      ["Anchors checked", String(anchors)],
      ["External links (not fetched)", String(external)],
      ["Site origins seen", [...origins].join(", ")],
      ["Failures", String(failures.length)],
    ],
  );

  if (failures.length > 0) {
    console.error("\nFailures:");
    for (const failure of [...new Set(failures)]) console.error(`  ${failure}`);
    return false;
  }
  console.log(
    "\nEvery internal link resolves, every anchor exists, every page carries its metadata.",
  );
  return true;
}

runIfMain(import.meta.url, (options) => withSite(options, crawl));
