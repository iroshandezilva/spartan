/**
 * Scaffolds a release note under `.changes/`.
 *
 * Writing the file by hand is fine. This exists so the common case produces a
 * note that already matches the format, with the migration section present when
 * the change is breaking.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { BUMPS, CHANGES_DIR, KINDS, parseArgs, parseNote } from "./release-notes-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const root = typeof args.get("root") === "string" ? args.get("root") : process.cwd();

function usage(message) {
  if (message !== undefined) {
    console.error(`${message}\n`);
  }
  console.error("Usage:");
  console.error(
    '  pnpm release:note --kind=<kind> --bump=<bump> --issue=HAUX-00 --summary="One line"\n',
  );
  console.error("Kinds and the bumps they may propose:");
  for (const [kind, config] of Object.entries(KINDS)) {
    console.error(`  ${kind.padEnd(10)} ${config.bumps.join(", ")}`);
    console.error(`  ${" ".repeat(10)} ${config.hint}`);
  }
  console.error("\nUse `--issue=none` only when no Linear issue applies.");
  console.error(`The format is documented in ${CHANGES_DIR}/README.md.`);
  process.exit(1);
}

const kind = args.get("kind");
const bump = args.get("bump");
const issue = args.get("issue");
const summary = args.get("summary");

if (typeof kind !== "string" || KINDS[kind] === undefined) {
  usage(`Provide --kind as one of: ${Object.keys(KINDS).join(", ")}`);
}
if (typeof bump !== "string" || !BUMPS.includes(bump)) {
  usage(`Provide --bump as one of: ${BUMPS.join(", ")}`);
}
if (typeof issue !== "string" || issue === "") {
  usage("Provide --issue as a Linear identifier such as HAUX-62, or `none`.");
}
if (typeof summary !== "string" || summary.trim() === "") {
  usage("Provide --summary as one line describing the change as a consumer would read it.");
}

const body =
  bump === "major"
    ? `${summary.trim()}\n\n## Migration\n\nDescribe exactly what a consumer must change, with before and after.\n`
    : `${summary.trim()}\n`;

const source = `---\nkind: ${kind}\nbump: ${bump}\nissue: ${issue}\n---\n\n${body}`;

const parsed = parseNote("(new)", source);
if (parsed.problems.length > 0 && bump !== "major") {
  console.error("The generated note is not valid:");
  for (const problem of parsed.problems) {
    console.error(`  ${problem}`);
  }
  process.exit(1);
}

const slug = summary
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .split("-")
  .slice(0, 6)
  .join("-");
const prefix = issue === "none" ? "note" : issue.toLowerCase();

mkdirSync(join(root, CHANGES_DIR), { recursive: true });

let fileName = `${prefix}-${slug}.md`;
let attempt = 2;
while (existsSync(join(root, CHANGES_DIR, fileName))) {
  fileName = `${prefix}-${slug}-${attempt}.md`;
  attempt += 1;
}

const path = join(CHANGES_DIR, fileName);
writeFileSync(join(root, path), source, "utf8");

console.log(`Wrote ${path}`);
if (bump === "major") {
  console.log("This is a breaking change. Fill in the `## Migration` section before opening a");
  console.log("pull request, or `pnpm release:check` will fail.");
}
