/**
 * Shared reading and validation for release notes under `.changes/`.
 *
 * The format is deliberately plain: one Markdown file per user-visible change,
 * with a small fixed header. It can be read without a dependency, written by
 * hand or by an agent, and interpreted without Git history. That last point
 * matters here, because this repository has no Git repository yet and the
 * release workflow still has to work.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export const CHANGES_DIR = ".changes";
export const CHANGELOG_FILE = "CHANGELOG.md";
export const PACKAGE_MANIFEST = join("packages", "spartant", "package.json");
export const LINEAR_ISSUE_BASE = "https://linear.app/wearehaux/issue/";

export const BUMPS = ["patch", "minor", "major"];

/**
 * Change kinds and the bumps each one is allowed to propose.
 *
 * This is the version policy from the CI plan expressed as data, so that a note
 * claiming the wrong bump fails instead of quietly shipping. Patch is compatible
 * fixes and behaviour-related documentation corrections. Minor is
 * backward-compatible components, variants, tokens, and features. Major is a
 * breaking API, token, behaviour, or package-structure change.
 *
 * Key order is the order sections appear in the changelog.
 */
export const KINDS = {
  component: {
    label: "Components",
    bumps: ["minor", "major"],
    hint: "A new component, variant, or size is minor. Changing or removing one is major. A defect inside an existing component is `fix`.",
  },
  api: {
    label: "API",
    bumps: ["minor", "major"],
    hint: "A new public export or prop is minor. Renaming, narrowing, or removing one is major.",
  },
  token: {
    label: "Tokens",
    bumps: ["patch", "minor", "major"],
    hint: "Correcting a token value is patch. Adding a semantic role is minor. Renaming, removing, or deprecating one is major.",
  },
  fix: {
    label: "Fixes",
    bumps: ["patch", "major"],
    hint: "A compatible fix is patch. A fix that changes documented behaviour is major and needs migration notes. A fix is never minor.",
  },
  docs: {
    label: "Documentation",
    bumps: ["patch"],
    hint: "Only for documentation tied to package behaviour. Documentation site work that does not change the package needs no note.",
  },
  build: {
    label: "Build and packaging",
    bumps: ["patch", "major"],
    hint: "Internal build changes that reach the tarball are patch. A package-structure change is major.",
  },
};

const HEADER_KEYS = new Set(["kind", "bump", "issue"]);
const ISSUE_PATTERN = /^(?:HAUX-\d+|none)$/;
const MIGRATION_HEADING = /^##\s+Migration\s*$/m;

/** Version placeholders that `release:prepare` rewrites and `release:check` audits. */
export const VERSION_MARKER =
  /(<!--\s*spartant-version\s*-->)([^<]*)(<!--\s*\/spartant-version\s*-->)/g;

const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".artifacts",
  "coverage",
  "storybook-static",
  ".git",
]);

/** Collects Markdown files, skipping generated and vendored trees. */
export function findMarkdown(dir, found = []) {
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

/**
 * Parses one release note. Never throws: every defect is returned in `problems`
 * so a single run can report all of them at once.
 */
export function parseNote(fileName, source) {
  const note = {
    fileName,
    kind: undefined,
    bump: undefined,
    issue: undefined,
    summary: "",
    body: "",
    migration: "",
    problems: [],
  };

  const normalized = source.replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  if (!match) {
    note.problems.push(
      "the file must start with a `---` header block containing `kind`, `bump`, and `issue`",
    );
    return note;
  }

  const header = new Map();
  for (const line of match[1].split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator === -1) {
      note.problems.push(`header line is not \`key: value\`: ${line.trim()}`);
      continue;
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!HEADER_KEYS.has(key)) {
      note.problems.push(
        `unknown header key \`${key}\`. Supported keys: ${[...HEADER_KEYS].join(", ")}`,
      );
      continue;
    }
    if (header.has(key)) {
      note.problems.push(`duplicate header key \`${key}\``);
      continue;
    }
    header.set(key, value);
  }

  note.kind = header.get("kind");
  note.bump = header.get("bump");
  note.issue = header.get("issue");
  note.body = match[2].trim();

  const kindConfig = note.kind === undefined ? undefined : KINDS[note.kind];
  if (note.kind === undefined) {
    note.problems.push("`kind` is required");
  } else if (kindConfig === undefined) {
    note.problems.push(`unknown \`kind\`: ${note.kind}. One of: ${Object.keys(KINDS).join(", ")}`);
  }

  if (note.bump === undefined) {
    note.problems.push("`bump` is required");
  } else if (!BUMPS.includes(note.bump)) {
    note.problems.push(`unknown \`bump\`: ${note.bump}. One of: ${BUMPS.join(", ")}`);
  } else if (kindConfig !== undefined && !kindConfig.bumps.includes(note.bump)) {
    note.problems.push(
      `\`kind: ${note.kind}\` cannot propose \`bump: ${note.bump}\`. ` +
        `Allowed: ${kindConfig.bumps.join(", ")}. ${kindConfig.hint}`,
    );
  }

  if (note.issue === undefined) {
    note.problems.push("`issue` is required. Use a Linear identifier such as HAUX-62, or `none`");
  } else if (!ISSUE_PATTERN.test(note.issue)) {
    note.problems.push(`\`issue\` must be a Linear identifier such as HAUX-62, or \`none\`.`);
  }

  if (note.body === "") {
    note.problems.push("the note has no body. Describe the change as a consumer would read it");
  } else {
    note.summary = note.body.split("\n")[0].trim();
  }

  if (note.bump === "major") {
    // Pre-1.0 does not excuse a breaking change from carrying migration notes.
    const heading = MIGRATION_HEADING.exec(note.body);
    if (heading === null) {
      note.problems.push(
        "a `major` note must contain a `## Migration` section telling consumers what to change",
      );
    } else {
      note.migration = note.body.slice(heading.index + heading[0].length).trim();
      if (note.migration === "") {
        note.problems.push("the `## Migration` section is empty");
      }
    }
  } else if (MIGRATION_HEADING.test(note.body)) {
    note.problems.push("only a `major` note may carry a `## Migration` section");
  }

  return note;
}

/** Reads and parses every pending note, sorted by file name for stable output. */
export function readNotes(root) {
  const dir = join(root, CHANGES_DIR);
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.endsWith(".md") && entry !== "README.md")
    .sort()
    .map((entry) => parseNote(entry, readFileSync(join(dir, entry), "utf8")));
}

/** The strongest bump requested by any pending note. */
export function highestBump(notes) {
  let highest;
  for (const note of notes) {
    if (note.bump === undefined || !BUMPS.includes(note.bump)) {
      continue;
    }
    if (highest === undefined || BUMPS.indexOf(note.bump) > BUMPS.indexOf(highest)) {
      highest = note.bump;
    }
  }
  return highest;
}

/**
 * Applies a bump to a semantic version.
 *
 * Below 1.0.0 a breaking change moves the minor segment rather than declaring
 * 1.0.0, because reaching a stable major through the first breaking change of a
 * v0.1 system would be an accident rather than a decision. Pass an explicit
 * version to `release:prepare` when a release should not follow this rule.
 */
export function nextVersion(current, bump) {
  const parts = current.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    throw new Error(`Not a plain semantic version: ${current}`);
  }
  const [major, minor, patch] = parts;
  if (bump === "major") {
    return major === 0 ? `0.${minor + 1}.0` : `${major + 1}.0.0`;
  }
  if (bump === "minor") {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}

/** Renders a note's issue reference as a Markdown link, or an empty string. */
export function issueLink(issue) {
  if (issue === undefined || issue === "none") {
    return "";
  }
  return ` ([${issue}](${LINEAR_ISSUE_BASE}${issue}))`;
}

/** Reads the published package version. */
export function readPackageVersion(root) {
  const manifest = JSON.parse(readFileSync(join(root, PACKAGE_MANIFEST), "utf8"));
  if (typeof manifest.version !== "string") {
    throw new Error(`${PACKAGE_MANIFEST} has no version field.`);
  }
  return manifest.version;
}

/** Finds every documentation version placeholder and the value it currently holds. */
export function findVersionMarkers(root) {
  const found = [];
  for (const file of findMarkdown(root).sort()) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(VERSION_MARKER)) {
      found.push({ file: relative(root, file), value: match[2].trim() });
    }
  }
  return found;
}

/** Minimal `--key=value` and `--flag` parsing. */
export function parseArgs(argv) {
  const args = new Map();
  for (const raw of argv) {
    if (!raw.startsWith("--")) {
      continue;
    }
    const separator = raw.indexOf("=");
    if (separator === -1) {
      args.set(raw.slice(2), true);
    } else {
      args.set(raw.slice(2, separator), raw.slice(separator + 1));
    }
  }
  return args;
}
