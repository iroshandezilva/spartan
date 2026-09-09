/**
 * Validates pending release notes and the documentation version references.
 *
 * Three separate failures are caught here:
 *
 *   1. A note that does not match the format, proposes a bump its kind is not
 *      allowed to propose, or is breaking without migration guidance.
 *   2. A documentation version placeholder that disagrees with the published
 *      package version.
 *   3. A release-relevant change with no release note at all.
 *
 * The third check needs a diff, so it needs Git. This repository is not a Git
 * repository yet, so the check reports loudly that it could not run instead of
 * pretending to pass. Pass `--strict` to turn that warning into a failure once
 * Git and the production branch exist, which is what CI should use.
 */

import { execFileSync } from "node:child_process";
import {
  CHANGES_DIR,
  findVersionMarkers,
  highestBump,
  KINDS,
  nextVersion,
  parseArgs,
  readNotes,
  readPackageVersion,
} from "./release-notes-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const root = typeof args.get("root") === "string" ? args.get("root") : process.cwd();
const base = typeof args.get("base") === "string" ? args.get("base") : "origin/main";
const strict = args.get("strict") === true;

/**
 * Paths whose change is visible to a consumer of the published package.
 * A change confined to tests, stories, apps, or examples needs no note.
 */
const RELEASE_RELEVANT = [/^packages\/spartant\/src\//, /^packages\/spartant\/package\.json$/];
const EXEMPT = [/\.test\.(ts|tsx|mts)$/, /\.stories\.(ts|tsx)$/, /\/__fixtures__\//];

const failures = [];
const warnings = [];

// 1. Note format and version guidance.

const notes = readNotes(root);
for (const note of notes) {
  for (const problem of note.problems) {
    failures.push(`${CHANGES_DIR}/${note.fileName}: ${problem}`);
  }
}

const valid = notes.filter((note) => note.problems.length === 0);

console.log(`Pending release notes: ${notes.length}`);
for (const note of notes) {
  const status = note.problems.length === 0 ? "ok  " : "FAIL";
  console.log(
    `  ${status} ${note.fileName}  ${note.kind ?? "?"}/${note.bump ?? "?"}  ${note.issue ?? "?"}`,
  );
}

// 2. Documentation version references.

const packageVersion = readPackageVersion(root);
const markers = findVersionMarkers(root);
console.log(`\nPackage version: ${packageVersion}`);
console.log(`Version references: ${markers.length}`);
for (const marker of markers) {
  const agrees = marker.value === packageVersion;
  console.log(`  ${agrees ? "ok  " : "FAIL"} ${marker.file}  ${marker.value}`);
  if (!agrees) {
    failures.push(
      `${marker.file}: version reference is ${marker.value}, but the package is ${packageVersion}. ` +
        "Run `pnpm release:prepare` to update every reference together.",
    );
  }
}

// 3. Release-relevant change without a note.

function changedFiles() {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { cwd: root, stdio: "pipe" });
  execFileSync("git", ["rev-parse", "--verify", base], { cwd: root, stdio: "pipe" });
  const merged = execFileSync("git", ["merge-base", base, "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
  return execFileSync("git", ["diff", "--name-only", `${merged}..HEAD`], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

let changed;
try {
  changed = changedFiles();
} catch {
  const message =
    `The missing-note check did not run. It needs a Git repository and the base ref \`${base}\`, ` +
    "and one of them is unavailable. No claim is made about whether this change needs a release note.";
  if (strict) {
    failures.push(message);
  } else {
    warnings.push(message);
  }
}

if (changed !== undefined) {
  const relevant = changed.filter(
    (file) =>
      RELEASE_RELEVANT.some((pattern) => pattern.test(file)) &&
      !EXEMPT.some((pattern) => pattern.test(file)),
  );
  console.log(`\nChanged files against ${base}: ${changed.length}`);
  console.log(`Release-relevant: ${relevant.length}`);
  for (const file of relevant) {
    console.log(`  ${file}`);
  }
  if (relevant.length > 0 && valid.length === 0) {
    failures.push(
      "This change touches the published package but carries no release note. " +
        "Run `pnpm release:note` to add one, or explain in the pull request why the change is not user visible.",
    );
  }
}

// Proposal.

const bump = highestBump(valid);
if (bump === undefined) {
  console.log("\nNo version bump is proposed, because no valid note is pending.");
} else {
  console.log(`\nProposed bump: ${bump}`);
  console.log(`Proposed version: ${packageVersion} -> ${nextVersion(packageVersion, bump)}`);
  const kinds = new Set(valid.map((note) => note.kind));
  console.log(`Kinds present: ${[...kinds].map((kind) => KINDS[kind].label).join(", ")}`);
}

for (const warning of warnings) {
  console.warn(`\nWarning: ${warning}`);
}

if (failures.length > 0) {
  console.error("\nRelease check failed:");
  for (const failure of failures) {
    console.error(`  ${failure}`);
  }
  console.error(`\nThe note format is documented in ${CHANGES_DIR}/README.md.`);
  process.exit(1);
}

console.log("\nRelease check passed.");
