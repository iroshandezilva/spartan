/**
 * Measures search relevance against the served `/api/search` route.
 *
 * The documentation plan requires that search returns relevant results for
 * component names, prop names, semantic token names, common tasks, and error
 * terms. Each term below names the page a reader needs (or the set of pages
 * any of which would do) and the check records where that page lands among
 * the distinct pages in the response, in the order the search dialog shows
 * them. A term passes when its page is among the first three.
 *
 * The list is the evaluation, so it is part of the source. Add a term when a
 * reader reports a search that failed; the fix is usually a `keywords` entry
 * on the page that should have answered.
 *
 *   node scripts/evaluate-search.mjs [--base URL]
 */

import { printTable, runIfMain, withSite } from "./lib/site.mjs";

const TOP = 3;

const C = (name) => `/docs/components/${name}`;
const F = (name) => `/docs/foundations/${name}`;
const S = (name) => `/docs/start/${name}`;
const X = (name) => `/docs/contributing/${name}`;

/** `expect` is one page or a list of pages, any of which satisfies the term. */
export const TERMS = [
  // Component names
  { category: "component", term: "Button", expect: C("button") },
  { category: "component", term: "Badge", expect: C("badge") },
  { category: "component", term: "Card", expect: C("card") },
  { category: "component", term: "Separator", expect: C("separator") },
  { category: "component", term: "Input", expect: C("text-fields") },
  { category: "component", term: "Textarea", expect: C("text-fields") },
  { category: "component", term: "Checkbox", expect: C("selection-controls") },
  { category: "component", term: "Switch", expect: C("selection-controls") },
  { category: "component", term: "RadioGroup", expect: C("selection-controls") },
  { category: "component", term: "Select", expect: C("select") },
  { category: "component", term: "Dialog", expect: C("dialog") },
  { category: "component", term: "Tooltip", expect: C("tooltip") },
  { category: "component", term: "Popover", expect: C("popover") },
  { category: "component", term: "Tabs", expect: C("tabs") },

  // Prop names
  { category: "prop", term: "loading", expect: C("button") },
  { category: "prop", term: "onOpenChange", expect: [C("dialog"), C("popover"), C("tooltip")] },
  {
    category: "prop",
    term: "onValueChange",
    expect: [C("tabs"), C("select"), C("selection-controls")],
  },
  { category: "prop", term: "indeterminate", expect: C("selection-controls") },
  { category: "prop", term: "decorative", expect: C("separator") },
  { category: "prop", term: "placement", expect: [C("popover"), C("tooltip")] },
  { category: "prop", term: "activation", expect: C("tabs") },
  { category: "prop", term: "keepMounted", expect: C("tabs") },
  { category: "prop", term: "dismissOnOutsideClick", expect: C("dialog") },
  { category: "prop", term: "placeholder", expect: [C("select"), C("text-fields")] },
  { category: "prop", term: "tone", expect: C("text-fields") },
  { category: "prop", term: "delay", expect: C("tooltip") },

  // Semantic token names
  { category: "token", term: "color.primary", expect: [F("color"), C("button")] },
  { category: "token", term: "color.foreground.muted", expect: [F("color"), C("card")] },
  {
    category: "token",
    term: "color.focus-ring",
    expect: [F("color"), F("accessibility"), C("button")],
  },
  { category: "token", term: "radius.control", expect: [F("radius-and-elevation"), C("button")] },
  {
    category: "token",
    term: "elevation.overlay",
    expect: [F("radius-and-elevation"), C("popover")],
  },
  { category: "token", term: "duration.press-feedback", expect: [F("motion"), C("button")] },
  { category: "token", term: "easing.enter", expect: [F("motion"), C("dialog")] },
  { category: "token", term: "space.control-gap", expect: [F("spacing"), C("button")] },
  { category: "token", term: "font.size.body", expect: [F("typography"), C("dialog")] },
  { category: "token", term: "size.min-target", expect: [F("accessibility"), C("button")] },
  { category: "token", term: "--spartant", expect: F("tokens") },
  { category: "token", term: "text-foreground-muted", expect: F("color") },

  // Common tasks
  { category: "task", term: "install", expect: S("installation") },
  { category: "task", term: "dark mode", expect: S("theming") },
  { category: "task", term: "styles.css", expect: S("installation") },
  { category: "task", term: "tailwind source", expect: S("installation") },
  { category: "task", term: "reduced motion", expect: [F("motion"), F("accessibility")] },
  { category: "task", term: "contrast", expect: [F("color"), F("accessibility")] },
  { category: "task", term: "run tests", expect: X("testing") },
  { category: "task", term: "release", expect: X("release-process") },
  { category: "task", term: "new component", expect: X("components") },
  { category: "task", term: "coding agent", expect: S("coding-agents") },
  { category: "task", term: "upgrade", expect: "/docs/releases/upgrading" },
  { category: "task", term: "changelog", expect: "/docs/releases/changelog" },
  { category: "task", term: "quick start", expect: S("quick-start") },
  { category: "task", term: "form validation", expect: C("text-fields") },

  // Error terms, as a reader would paste them
  { category: "error", term: "unstyled button", expect: S("installation") },
  { category: "error", term: "Cannot find module", expect: S("installation") },
  { category: "error", term: "Client Component", expect: S("installation") },
  { category: "error", term: "peer dependency", expect: S("installation") },
  { category: "error", term: "useTheme ThemeProvider", expect: S("theming") },
  { category: "error", term: "hydration mismatch", expect: S("theming") },
  { category: "error", term: "flash of wrong theme", expect: S("theming") },
  { category: "error", term: "Radio outside RadioGroup", expect: C("selection-controls") },
  { category: "error", term: "outside its Dialog", expect: C("dialog") },
];

/** Distinct page paths in the order the search dialog lists them. */
function distinctPages(results) {
  const pages = [];
  for (const result of results) {
    const path = String(result.url).split("#")[0];
    if (!pages.includes(path)) pages.push(path);
  }
  return pages;
}

export async function evaluateTerm(base, entry) {
  const response = await fetch(`${base}/api/search?query=${encodeURIComponent(entry.term)}`);
  if (!response.ok) throw new Error(`search returned ${response.status} for "${entry.term}"`);
  const results = await response.json();
  const pages = distinctPages(results);
  const expected = Array.isArray(entry.expect) ? entry.expect : [entry.expect];
  const ranks = expected.map((page) => pages.indexOf(page)).filter((i) => i >= 0);
  const rank = ranks.length > 0 ? Math.min(...ranks) + 1 : 0;
  return { ...entry, expected, rank, pages, results: results.length };
}

export async function evaluate(base) {
  const rows = [];
  for (const entry of TERMS) rows.push(await evaluateTerm(base, entry));

  printTable(
    ["Category", "Term", "Expected", "Rank", "First page returned"],
    rows.map((r) => [
      r.category,
      r.term,
      r.expected.length === 1 ? r.expected[0] : `any of ${r.expected.length}`,
      r.rank === 0 ? "miss" : String(r.rank),
      r.pages[0] ?? "(no results)",
    ]),
  );

  const failing = rows.filter((r) => r.rank === 0 || r.rank > TOP);
  const byCategory = {};
  for (const r of rows) {
    byCategory[r.category] ??= { total: 0, pass: 0 };
    byCategory[r.category].total += 1;
    if (r.rank > 0 && r.rank <= TOP) byCategory[r.category].pass += 1;
  }
  console.log("");
  for (const [category, { total, pass }] of Object.entries(byCategory)) {
    console.log(`${category}: ${pass}/${total} within the first ${TOP} pages`);
  }

  if (failing.length > 0) {
    console.error(`\n${failing.length} term(s) did not land within the first ${TOP} pages:`);
    for (const r of failing) {
      console.error(
        `  "${r.term}" wanted ${r.expected.join(" or ")}; got ${r.pages.slice(0, 5).join(", ") || "nothing"}`,
      );
    }
    return false;
  }
  console.log(`\nEvery term lands within the first ${TOP} pages.`);
  return true;
}

runIfMain(import.meta.url, (options) => withSite(options, evaluate));
