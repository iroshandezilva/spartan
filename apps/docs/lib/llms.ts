/**
 * The machine-readable entry points, generated from the same page tree the
 * site renders so neither can fall behind the content.
 *
 * `/llms.txt` follows the llms.txt convention: a title, a summary, and
 * sections of Markdown links with one-line descriptions. It adds what a
 * coding agent needs before it reads anything else: the source-of-truth
 * order, the stop conditions, the commands, and the repository files that
 * have no page of their own.
 */

import type * as PageTree from "fumadocs-core/page-tree";
import {
  REPOSITORY_FILES,
  SOURCE_OF_TRUTH_ORDER,
  SOURCE_OF_TRUTH_RULE,
  STABLE_COMMANDS,
  STOP_CONDITIONS,
  STOP_RULE,
} from "@/lib/agent-guidance";
import {
  absoluteUrl,
  packageName,
  repositoryFileUrl,
  repositoryUrl,
  siteDescription,
  siteName,
} from "@/lib/shared";
import { type DocsPageData, source } from "@/lib/source";

function link(title: string, url: string, description?: string): string {
  const item = `- [${title}](${absoluteUrl(url)})`;
  return description ? `${item}: ${description}` : item;
}

/** Every page in navigation order: index first, then each section in `meta.json` order. */
export function pagesInTreeOrder(): DocsPageData[] {
  const byUrl = new Map(source.getPages().map((page) => [page.url, page]));
  const ordered: DocsPageData[] = [];
  const visit = (node: PageTree.Node) => {
    if (node.type === "page") {
      const page = byUrl.get(node.url);
      if (page) ordered.push(page);
    } else if (node.type === "folder") {
      if (node.index) visit(node.index);
      for (const child of node.children) visit(child);
    }
  };
  for (const child of source.getPageTree().children) visit(child);
  return ordered;
}

function pageItem(node: PageTree.Item): string {
  const page = source.getPages().find((candidate) => candidate.url === node.url);
  return link(page?.data.title ?? String(node.name), node.url, page?.data.description);
}

function sectionLines(node: PageTree.Folder): string[] {
  const lines: string[] = [];
  if (node.index) lines.push(pageItem(node.index));
  for (const child of node.children) {
    if (child.type === "page") lines.push(pageItem(child));
    else if (child.type === "folder") lines.push(...sectionLines(child));
  }
  return lines;
}

/** The content of `/llms.txt`. */
export function llmsIndex(): string {
  const tree = source.getPageTree();
  const out: string[] = [];

  out.push(`# ${siteName}`, "");
  out.push(`> ${siteDescription}`, "");
  out.push(
    `Spartant is distributed as one npm package, \`${packageName}\`, for React 19 and TypeScript, with Tailwind CSS v4 optional. It owns its component source, public API, tokens, and themes. The repository is ${repositoryUrl} and its production branch is \`main\`. This file is generated from the same page tree the site renders. [llms-full.txt](${absoluteUrl("/llms-full.txt")}) holds every page below as one Markdown document, including the token tables and Storybook coverage tables that are generated at build time.`,
    "",
  );

  out.push("## Agent guidance", "");
  out.push(
    `Read [Using with a coding agent](${absoluteUrl("/docs/start/coding-agents")}) first. The authoritative guide is \`AGENTS.md\` at the repository root; the page and this file restate the parts an agent needs before opening anything else. Run every command from the repository root through pnpm, never npm or yarn. Style with semantic roles only, never a raw colour or a palette step. Do not add a dependency, expand scope, or expose a primitive library's API without a Linear issue that approves it. Never write an em dash anywhere in the repository.`,
    "",
  );
  out.push("Source-of-truth order, earlier wins:", "");
  out.push(...SOURCE_OF_TRUTH_ORDER.map((item, i) => `${i + 1}. ${item}`), "");
  out.push(SOURCE_OF_TRUTH_RULE, "");
  out.push("Stop and ask for a decision when:", "");
  out.push(...STOP_CONDITIONS.map((item) => `- ${item}`), "");
  out.push(STOP_RULE, "");

  for (const node of tree.children) {
    if (node.type === "page") {
      out.push("## Introduction", "", pageItem(node), "");
    } else if (node.type === "folder") {
      const title = typeof node.name === "string" ? node.name : "Section";
      out.push(`## ${title}`, "");
      if (typeof node.description === "string" && node.description) out.push(node.description, "");
      out.push(...sectionLines(node), "");
    }
  }

  out.push("## Commands", "");
  out.push("All from the repository root, through pnpm.", "");
  out.push(...STABLE_COMMANDS.map((c) => `- \`${c.command}\`: ${c.does}`), "");

  out.push("## Repository files", "");
  out.push(
    "Stable source paths on the production branch. The pages above link to these rather than copying them, so the file is always the current version.",
    "",
  );
  out.push(...REPOSITORY_FILES.map((f) => link(f.path, repositoryFileUrl(f.path), f.holds)), "");

  out.push("## Package", "");
  out.push(
    `- Package name: \`${packageName}\`. Every runtime export comes from the package root; the only subpath exports are \`./styles.css\`, \`./theme.css\`, \`./tokens.json\`, and \`./package.json\`.`,
    `- Source: [packages/spartant/](${repositoryFileUrl("packages/spartant/")}). Entry point \`src/index.ts\`, components under \`src/components/\`, tokens under \`src/tokens/\`, styles under \`src/styles/\`, theme runtime under \`src/theme/\`.`,
    `- Storybook stories: [apps/storybook/src/stories/](${repositoryFileUrl("apps/storybook/src/stories/")}), one \`<Name>.stories.tsx\` per component family. Each file's \`contract\` object is the machine-readable accessibility, motion, and manual-check contract.`,
    `- This site's source: [apps/docs/content/docs/](${repositoryFileUrl("apps/docs/content/docs/")}).`,
    "",
  );

  return `${out.join("\n").trimEnd()}\n`;
}

/** The preamble of `/llms-full.txt`, before the pages. */
export function llmsFullPreamble(pageCount: number): string {
  return [
    `# ${siteName} documentation, full text`,
    "",
    `> ${siteDescription}`,
    "",
    `Every published page of the ${siteName} documentation as one Markdown document, ${pageCount} pages in navigation order. Each page begins with a level-one heading carrying its title and URL. Tables that the site generates from the package's published token JSON at build time are rendered here as Markdown tables from the same data; live interactive examples are noted and omitted. The index with agent guidance and repository links is [llms.txt](${absoluteUrl("/llms.txt")}).`,
    "",
    "",
  ].join("\n");
}
