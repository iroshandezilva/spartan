/**
 * Runs axe over representative pages of the served site, with the same rule
 * set the Storybook workbench and story tests use.
 *
 * The configuration is imported from `apps/storybook/src/lib/a11y.ts` rather
 * than restated, so the documentation and the components are held to one
 * standard. The one deliberate difference: the page-level rules that file
 * disables for stories (a story is a fragment, not a document) are turned
 * back on here, because these are whole documents and those rules are the
 * point.
 *
 * Pages are rendered in happy-dom without CSS. Two consequences a reader of
 * the output needs to know:
 *
 * - There is no layout engine, so `color-contrast` comes back `incomplete`
 *   rather than passing or failing. Rendered contrast is measured separately
 *   in a real browser; see the docs README.
 * - Nothing is `display: none`, so elements the stylesheet shows only on a
 *   narrow or only on a wide viewport are all present at once. A finding here
 *   is the union of both breakpoints, and the report says so.
 *
 *   node scripts/audit-a11y.mjs [--base URL] [path ...]
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Window } from "happy-dom";
import { AXE_CONFIG, PAGE_LEVEL_RULES } from "../../storybook/src/lib/a11y.ts";
import { printTable, runIfMain, withSite } from "./lib/site.mjs";

/** Home, a Start page, a foundation page, two component pages, a contributing page, and the error route. */
export const REPRESENTATIVE_PAGES = [
  "/",
  "/docs",
  "/docs/start/installation",
  "/docs/foundations/color",
  "/docs/components/button",
  "/docs/components/dialog",
  "/docs/contributing/testing",
  "/docs/this-page-does-not-exist",
];

/**
 * Findings that are understood, cannot be fixed inside this app, and are
 * recorded here so the audit stays a gate for everything else. Each entry
 * names the rule, a pattern the reported target must match, and the reason.
 * Remove an entry when the cause is gone; the audit fails if an entry stops
 * matching anything, so a stale allowance cannot outlive its finding.
 */
export const KNOWN_FINDINGS = [
  {
    id: "landmark-banner-is-top-level",
    target: /bg-fd-background/,
    reason:
      "The narrow-viewport table-of-contents popover is a <header> inside Fumadocs UI. It sits in a navigation landmark, which HTML-AAM says removes the banner role, but axe's matcher checks ancestor elements only (article, aside, main, nav, section), not roles. The element cannot be changed from outside fumadocs-ui.",
  },
];

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.js"), "utf8");

/** The shared rule set, with the document-level rules enabled. */
const config = {
  ...AXE_CONFIG,
  rules: {
    ...AXE_CONFIG.rules,
    ...Object.fromEntries(PAGE_LEVEL_RULES.map((id) => [id, { enabled: true }])),
  },
};

export async function auditPage(base, path) {
  const url = `${base}${path}`;
  const response = await fetch(url);
  const html = await response.text();
  const window = new Window({
    url,
    settings: {
      disableJavaScriptFileLoading: true,
      disableJavaScriptEvaluation: true,
      disableCSSFileLoading: true,
    },
  });
  window.document.write(html);
  await window.happyDOM.waitUntilComplete();
  window.eval(axeSource);
  const results = await window.eval(`axe.run(document, ${JSON.stringify(config)})`);
  const known = [];
  const violations = [];
  for (const v of results.violations) {
    const nodes = v.nodes.map((n) => n.target.join(" "));
    const allowed = KNOWN_FINDINGS.find((k) => k.id === v.id);
    const unexplained = allowed ? nodes.filter((n) => !allowed.target.test(n)) : nodes;
    if (allowed) known.push({ id: v.id, nodes: nodes.filter((n) => allowed.target.test(n)) });
    if (unexplained.length > 0) {
      violations.push({ id: v.id, impact: v.impact, help: v.help, nodes: unexplained });
    }
  }
  const summary = {
    path,
    status: response.status,
    violations,
    known,
    incomplete: results.incomplete.map((v) => v.id),
    passes: results.passes.length,
  };
  await window.happyDOM.close();
  return summary;
}

export async function audit(base, paths = REPRESENTATIVE_PAGES) {
  let ok = true;
  const summaries = [];
  for (const path of paths) summaries.push(await auditPage(base, path));

  printTable(
    ["Page", "Status", "Violations", "Known", "Passes", "Incomplete"],
    summaries.map((s) => [
      s.path,
      String(s.status),
      String(s.violations.length),
      String(s.known.reduce((n, k) => n + k.nodes.length, 0)),
      String(s.passes),
      s.incomplete.join(", ") || "none",
    ]),
  );

  const seen = new Set(summaries.flatMap((s) => s.known.map((k) => k.id)));
  for (const finding of KNOWN_FINDINGS) {
    if (!seen.has(finding.id)) {
      console.error(`\nKnown finding "${finding.id}" no longer matches anything. Remove it from KNOWN_FINDINGS.`);
      ok = false;
    }
  }
  if (seen.size > 0) {
    console.log("\nKnown findings, recorded in KNOWN_FINDINGS with their reasons:");
    for (const finding of KNOWN_FINDINGS) {
      if (seen.has(finding.id)) console.log(`  ${finding.id}: ${finding.reason}`);
    }
  }

  console.log(
    "\nhappy-dom has no layout engine: color-contrast is reported incomplete, never evaluated. Hidden-at-this-breakpoint elements are all present, so a finding is the union of narrow and wide layouts.",
  );

  for (const s of summaries) {
    if (s.violations.length === 0) continue;
    ok = false;
    console.error(`\n${s.path}`);
    for (const v of s.violations) {
      console.error(`  ${v.id} (${v.impact}): ${v.help}`);
      for (const node of v.nodes) console.error(`    ${node}`);
    }
  }
  if (ok) console.log("\nNo axe violations on the representative pages.");
  return ok;
}

runIfMain(import.meta.url, (options) =>
  withSite(options, (base) => audit(base, options.rest.length > 0 ? options.rest : undefined)),
);
