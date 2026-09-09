/**
 * Validates links in the repository's Markdown.
 *
 * Relative links are resolved on disk, which is the class of breakage that
 * actually happens: a file moves and every pointer to it rots silently.
 *
 * External links are checked for shape, not reachability. Most of this
 * project's external links are Linear documents behind authentication, so
 * fetching them would fail for reasons unrelated to correctness and would make
 * the check depend on the network.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".artifacts",
  "coverage",
  "storybook-static",
  ".git",
]);

/** Markdown inline links, ignoring image embeds. */
const LINK_PATTERN = /(?<!!)\[[^\]]*\]\(([^)]+)\)/g;

function findMarkdown(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!IGNORED_DIRS.has(entry)) {
        findMarkdown(full, found);
      }
    } else if (entry.endsWith(".md")) {
      found.push(full);
    }
  }
  return found;
}

const problems = [];
const files = findMarkdown(process.cwd()).sort();
let checked = 0;

for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");

  lines.forEach((line, index) => {
    for (const match of line.matchAll(LINK_PATTERN)) {
      // Strip an optional link title: [text](target "title")
      const target = match[1].trim().split(/\s+/)[0];
      if (target === undefined || target === "") {
        continue;
      }
      checked += 1;
      const where = `${relative(process.cwd(), file)}:${index + 1}`;

      if (target.startsWith("#")) {
        continue;
      }

      if (/^[a-z][a-z0-9+.-]*:/i.test(target)) {
        if (!/^https?:\/\/[^\s]+$/i.test(target) && !target.startsWith("mailto:")) {
          problems.push(`${where}  malformed URL: ${target}`);
        }
        continue;
      }

      const path = resolve(dirname(file), target.split("#")[0] ?? "");
      try {
        statSync(path);
      } catch {
        problems.push(`${where}  broken relative link: ${target}`);
      }
    }
  });
}

console.log(`Checked ${checked} links across ${files.length} Markdown files.`);

if (problems.length > 0) {
  console.error("\nBroken links:");
  for (const problem of problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}

console.log("All links resolve.");
