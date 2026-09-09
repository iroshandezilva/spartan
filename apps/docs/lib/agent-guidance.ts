/**
 * The agent guidance the machine-readable entry points and the "Using with a
 * coding agent" page both carry, kept in one place so the two cannot
 * disagree.
 *
 * These lists restate `AGENTS.md` at the repository root, which remains the
 * authority. They are copied rather than linked because an agent reading
 * `/llms.txt` has to know the source-of-truth order and the stop conditions
 * before it opens anything else, and because the site must answer without a
 * repository checkout. If `AGENTS.md` changes, change this file in the same
 * pull request.
 */

/** Decision order when sources disagree. Position is meaning: earlier wins. */
export const SOURCE_OF_TRUTH_ORDER: readonly string[] = [
  "The current Linear issue and its acceptance criteria",
  "Documents attached to that issue",
  "Existing repository conventions, tests, and public APIs",
  "Existing Spartant components and tokens",
  "Official upstream documentation",
];

export const SOURCE_OF_TRUTH_RULE =
  "If two sources conflict, stop and report the conflict. Do not silently choose one.";

/** Situations in which an agent stops and asks for a decision instead of proceeding. */
export const STOP_CONDITIONS: readonly string[] = [
  "A public API choice is materially ambiguous.",
  "A new dependency changes the architecture or the consumer contract.",
  "Required accessibility behaviour cannot be met.",
  "A release requires credentials or authority not already granted.",
  "The issue conflicts with a confirmed project decision.",
  "The acceptance criteria require meaningful scope expansion.",
  "Tests fail for reasons that cannot be resolved without changing unrelated work.",
];

export const STOP_RULE =
  "Do not hide the blocker, lower the acceptance criteria, or silently change the intended behaviour.";

export interface RepositoryFile {
  /** Path from the repository root. A trailing slash marks a directory. */
  path: string;
  /** What an agent finds there. */
  holds: string;
}

/**
 * The repository files an agent needs that have no page of their own. Each
 * documentation page that covers the same ground links to the file rather
 * than restating it, so the file cannot drift from the page.
 */
export const REPOSITORY_FILES: readonly RepositoryFile[] = [
  {
    path: "AGENTS.md",
    holds:
      "The authoritative agent guide: source-of-truth order, the Linear workflow, boundaries, token rules, component and Storybook requirements, verification, the manual-test policy, the definition of done, the completion report format, and the stop conditions",
  },
  {
    path: "CLAUDE.md",
    holds:
      "Repository state and day-one facts: commands, workspace layout, styling rules, confirmed release decisions",
  },
  {
    path: ".github/CONTRIBUTING.md",
    holds: "A short human orientation that defers to AGENTS.md",
  },
  {
    path: ".github/PULL_REQUEST_TEMPLATE.md",
    holds: "Every section a pull request must fill in honestly",
  },
  {
    path: "MANUAL-REVIEW.md",
    holds:
      "The manual review checklist: keyboard, focus, screen reader, pointer and touch, layout, motion, reduced motion, overlays, gestures, form controls, and the result block",
  },
  {
    path: ".github/workflows/validate.yml",
    holds: "The CI gate. It mirrors the pnpm validate script step by step",
  },
  {
    path: ".github/RELEASE.md",
    holds:
      "How the package reaches the npm registry: trusted publishing, the runbook, the rehearsal paths, failure diagnosis, and rollback",
  },
  {
    path: ".github/workflows/release.yml",
    holds: "The protected release workflow",
  },
  {
    path: ".github/BRANCH_PROTECTION.md",
    holds: "The production branch rules",
  },
  {
    path: "CHANGELOG.md",
    holds: "The consumer-facing record of every released change",
  },
  {
    path: ".changes/README.md",
    holds:
      "Release notes: one file per change, the kind to version mapping, and the release preparation commands",
  },
  {
    path: "packages/spartant/VERSIONING.md",
    holds: "What is public, the version rules, and the deprecation path",
  },
  {
    path: "packages/spartant/src/index.ts",
    holds: "The public entry point. Every runtime export passes through it",
  },
  {
    path: "packages/spartant/src/components/",
    holds: "Owned component source, one directory per family",
  },
  {
    path: "packages/spartant/src/components/INVENTORY.md",
    holds: "The approved v0.1 component inventory and what is deferred",
  },
  {
    path: "packages/spartant/src/components/API-CONVENTIONS.md",
    holds: "The rules every component API follows",
  },
  {
    path: "packages/spartant/src/components/ADOPTING-SHADCN.md",
    holds: "The checklist for adopting a shadcn source file",
  },
  {
    path: "packages/spartant/src/tokens/README.md",
    holds:
      "The token taxonomy, naming grammar, state names, override boundaries, and deprecation rules",
  },
  {
    path: "packages/spartant/src/tokens/FOUNDATIONS.md",
    holds: "The frozen motion scale and the foundation decisions behind the token values",
  },
  {
    path: "packages/spartant/src/styles/theme.css",
    holds: "The Tailwind mapping of semantic roles and the global reduced-motion rule",
  },
  {
    path: "apps/storybook/STORY-TEMPLATE.md",
    holds:
      "The shape of a story file, including the contract object the documentation must agree with",
  },
  {
    path: "apps/storybook/VISUAL-REVIEW.md",
    holds:
      "How a static Storybook artifact is reviewed in place of a hosted visual-regression provider",
  },
  {
    path: ".claude/skills/spartant-component-builder/SKILL.md",
    holds:
      "The repository's own component skill: build order, the frozen motion scale, a review mode, and the traps that cost time",
  },
  {
    path: "apps/docs/DEPLOYMENT.md",
    holds:
      "The Vercel policy for this site: production branch only, no previews, the environment values, verification, and rollback",
  },
];

export interface StableCommand {
  command: string;
  does: string;
}

/** The commands an agent runs, all from the repository root through pnpm. */
export const STABLE_COMMANDS: readonly StableCommand[] = [
  { command: "pnpm install", does: "Install. pnpm only; a preinstall guard rejects npm and yarn" },
  {
    command: "pnpm validate",
    does: "The full gate: format check, lint, doc links, token checks, colour checks, type check, tests, story tests, build, package inspection. Run it before claiming work is complete",
  },
  { command: "pnpm format:check", does: "Biome formatting. pnpm format writes" },
  { command: "pnpm lint", does: "Biome lint, including accessibility and React hook rules" },
  { command: "pnpm check:docs", does: "Relative links in every Markdown file resolve" },
  {
    command: "pnpm check:tokens",
    does: "Token sources against the schema, alias resolution, layer rules, naming grammar, and emission",
  },
  {
    command: "pnpm tokens:check",
    does: "Generated CSS, JSON, and TypeScript token outputs are not stale",
  },
  {
    command: "pnpm check:colors",
    does: "Contrast and gamut over every required pairing in both themes",
  },
  { command: "pnpm typecheck", does: "TypeScript project references, then the test files" },
  {
    command: "pnpm test",
    does: 'Vitest, Node only. pnpm test <path> runs one file; -t "<name>" one test',
  },
  {
    command: "pnpm test:stories",
    does: "Renders every story, awaits its play function, audits it with axe",
  },
  { command: "pnpm build", does: "Every workspace in dependency order" },
  {
    command: "pnpm inspect:package",
    does: "Packs the package and fails if anything unexpected would ship",
  },
  {
    command: "pnpm smoke:package",
    does: "Installs the packed tarball in a throwaway project outside the workspace",
  },
  {
    command: "pnpm release:check",
    does: "Validates pending release notes and proposes the next version",
  },
  { command: "pnpm dev:storybook", does: "The component workbench on port 6006" },
  { command: "pnpm dev:docs", does: "This site on port 3100" },
];
