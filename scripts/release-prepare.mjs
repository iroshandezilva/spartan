/**
 * Turns the pending release notes into one auditable release change.
 *
 * With `--dry-run` it only proposes: this is `pnpm release:plan`, and it writes
 * nothing. Without it, one run does every part of the preparation together, so
 * the version, the changelog, and the documentation version references cannot
 * drift apart:
 *
 *   - bumps the package version
 *   - folds the notes into CHANGELOG.md under a dated heading
 *   - rewrites every documentation version reference
 *   - deletes the consumed notes
 *   - writes a release pull request body to `.artifacts/`
 *
 * It deliberately runs no Git command. The repository has no Git repository
 * yet, and even once it does, an unattended commit is not something a release
 * script should perform on its own. The commands to run are printed instead.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CHANGELOG_FILE,
  CHANGES_DIR,
  findMarkdown,
  highestBump,
  issueLink,
  KINDS,
  nextVersion,
  PACKAGE_MANIFEST,
  parseArgs,
  readNotes,
  readPackageVersion,
  VERSION_MARKER,
} from "./release-notes-lib.mjs";

const RELEASES_ANCHOR = "<!-- releases -->";

const args = parseArgs(process.argv.slice(2));
const root = typeof args.get("root") === "string" ? args.get("root") : process.cwd();
const dryRun = args.get("dry-run") === true;
const forcedVersion = typeof args.get("version") === "string" ? args.get("version") : undefined;
const date =
  typeof args.get("date") === "string" ? args.get("date") : new Date().toISOString().slice(0, 10);

const notes = readNotes(root);

const invalid = notes.filter((note) => note.problems.length > 0);
if (invalid.length > 0) {
  console.error("Some release notes are not valid. Run `pnpm release:check` for the detail.");
  for (const note of invalid) {
    console.error(`  ${CHANGES_DIR}/${note.fileName}`);
  }
  process.exit(1);
}

if (notes.length === 0) {
  console.error(`No release notes are pending in ${CHANGES_DIR}/.`);
  console.error("A release needs at least one note. Add one with `pnpm release:note`.");
  process.exit(1);
}

const currentVersion = readPackageVersion(root);
const bump = highestBump(notes);
const version = forcedVersion ?? nextVersion(currentVersion, bump);

/** Renders the changelog section for this release. */
function renderSection() {
  const lines = [`## ${version} - ${date}`, ""];

  const breaking = notes.filter((note) => note.bump === "major");
  if (breaking.length > 0) {
    lines.push("### Breaking changes", "");
    for (const note of breaking) {
      lines.push(`- ${note.summary}${issueLink(note.issue)}`, "");
      for (const line of note.migration.split("\n")) {
        lines.push(line === "" ? "" : `  ${line}`);
      }
      lines.push("");
    }
  }

  for (const [kind, config] of Object.entries(KINDS)) {
    const entries = notes.filter((note) => note.kind === kind && note.bump !== "major");
    if (entries.length === 0) {
      continue;
    }
    lines.push(`### ${config.label}`, "");
    for (const note of entries) {
      lines.push(`- ${note.summary}${issueLink(note.issue)}`);
    }
    lines.push("");
  }

  return `${lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;
}

const section = renderSection();

console.log(`Current version: ${currentVersion}`);
console.log(`Pending notes:   ${notes.length}`);
console.log(`Highest bump:    ${bump}`);
if (forcedVersion !== undefined) {
  console.log(`Forced version:  ${version}`);
} else {
  console.log(`Proposed:        ${version}`);
}
console.log(`\n${section}`);

if (dryRun) {
  console.log("Dry run. Nothing was written. Run `pnpm release:prepare` to apply this.");
  process.exit(0);
}

// Changelog.

const changelogPath = join(root, CHANGELOG_FILE);
const changelog = readFileSync(changelogPath, "utf8");
if (!changelog.includes(RELEASES_ANCHOR)) {
  console.error(
    `${CHANGELOG_FILE} has no \`${RELEASES_ANCHOR}\` anchor to insert the release under.`,
  );
  process.exit(1);
}
writeFileSync(
  changelogPath,
  changelog.replace(RELEASES_ANCHOR, `${RELEASES_ANCHOR}\n\n${section.trim()}`),
  "utf8",
);

// Package version.

const manifestPath = join(root, PACKAGE_MANIFEST);
const manifest = readFileSync(manifestPath, "utf8");
const bumped = manifest.replace(/("version":\s*")[^"]*(")/, `$1${version}$2`);
if (bumped === manifest) {
  console.error(`Could not rewrite the version field in ${PACKAGE_MANIFEST}.`);
  process.exit(1);
}
writeFileSync(manifestPath, bumped, "utf8");

// Documentation version references.

const updated = [];
for (const file of findMarkdown(root).sort()) {
  const source = readFileSync(file, "utf8");
  const next = source.replace(VERSION_MARKER, `$1${version}$3`);
  if (next !== source) {
    writeFileSync(file, next, "utf8");
    updated.push(file.slice(root.length + 1));
  }
}

// Consume the notes.

const consumed = [];
for (const note of notes) {
  rmSync(join(root, CHANGES_DIR, note.fileName));
  consumed.push(`${CHANGES_DIR}/${note.fileName}`);
}

// Release pull request body.

const artifactsDir = join(root, ".artifacts");
mkdirSync(artifactsDir, { recursive: true });
const prBodyPath = join(".artifacts", `release-${version}.md`);
const prBody = [
  `# Release ${version}`,
  "",
  `Prepared from ${notes.length} release note${notes.length === 1 ? "" : "s"}, ` +
    `bumping \`${currentVersion}\` to \`${version}\` (${bump}).`,
  "",
  section.trim(),
  "",
  "## Release readiness",
  "",
  "- [ ] CI is green on the production branch",
  "- [ ] Required manual tests are confirmed",
  "- [ ] `pnpm validate` passes",
  "- [ ] `pnpm inspect:package` shows the intended contents",
  "- [ ] A clean consumer installs the packed artifact",
  "- [ ] Documentation matches this version",
  "- [ ] Rollback or follow-up path is recorded",
  "",
].join("\n");
writeFileSync(join(root, prBodyPath), prBody, "utf8");

console.log(`Updated ${CHANGELOG_FILE}`);
console.log(`Updated ${PACKAGE_MANIFEST} to ${version}`);
for (const file of updated) {
  console.log(`Updated version reference in ${file}`);
}
for (const file of consumed) {
  console.log(`Consumed ${file}`);
}
console.log(`Wrote ${prBodyPath}`);

console.log("\nNothing was committed. Review the diff, then create one release change:");
console.log(`  git switch -c release/v${version}`);
console.log("  git add -A");
console.log(`  git commit -m "Release ${version}"`);
console.log(`  gh pr create --base main --title "Release ${version}" --body-file ${prBodyPath}`);
console.log("\nThis repository is not a Git repository yet, so those commands are guidance.");
