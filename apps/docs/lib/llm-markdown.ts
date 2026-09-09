/**
 * Markdown forms of the components the MDX pages use, for `/llms-full.txt`.
 *
 * The pages are compiled with `includeProcessedMarkdown: { output: "function" }`,
 * so their prose is stringified at build time while every JSX element keeps
 * its real props and resolves from this map. A component here calls
 * `asMarkdown()` and returns Markdown text; one that is missing is serialized
 * as JSX syntax, which is exactly the gap this file closes. Every table below
 * reads the same published token JSON as the rendered component, through the
 * same helpers, so the text and the page cannot disagree.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import manifest from "@iroshandezilva/spartant/package.json";
import { asMarkdown, md } from "fumadocs-core/server";
import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { FAMILIES, STEPS } from "@/components/foundation/ColorScale";
import { KIND_LABEL, measure, shortRole } from "@/components/foundation/ContrastMatrix";
import { motionRows, springRows } from "@/components/foundation/MotionTokens";
import { ELEVATION_PAIRING } from "@/components/foundation/ShapeSamples";
import { primitiveSteps } from "@/components/foundation/SpacingScale";
import { display } from "@/components/foundation/TokenTable";
import { typeRows } from "@/components/foundation/TypeSpecimens";
import {
  REPOSITORY_FILES,
  SOURCE_OF_TRUTH_ORDER,
  SOURCE_OF_TRUTH_RULE,
  STOP_CONDITIONS,
  STOP_RULE,
} from "@/lib/agent-guidance";
import { toHex } from "@/lib/contrast";
import { groupExports } from "@/lib/package-exports";
import { type PairingKind, REQUIRED_PAIRINGS } from "@/lib/pairings";
import { packageName, repositoryFileUrl } from "@/lib/shared";
import {
  colorRoles,
  cssVariable,
  isShadow,
  isSpring,
  primitiveTokens,
  remToPx,
  rolesUnder,
  scalar,
  shadowToCss,
} from "@/lib/tokens";

const STORIES_DIR = "apps/storybook/src/stories";

const version: string = manifest.version;

function cell(text: string): string {
  return text
    .replace(/\s*\n\s*/g, " ")
    .replaceAll("|", "\\|")
    .trim();
}

function code(text: string): string {
  return `\`${text}\``;
}

/** A GitHub-flavoured Markdown table as a block. */
function table(headers: readonly string[], rows: readonly (readonly string[])[]): string {
  const line = (cells: readonly string[]) => `| ${cells.map(cell).join(" | ")} |`;
  return `\n${line(headers)}\n|${" --- |".repeat(headers.length)}\n${rows.map(line).join("\n")}\n\n`;
}

function paragraph(text: string): string {
  return `\n${text}\n\n`;
}

function note(text: string): string {
  return paragraph(`*${text}*`);
}

/** A rendered example has no text form. Say so, rather than leave a JSX tag. */
function liveExample(): string {
  asMarkdown();
  return note(
    "A live example is rendered here on the page, built from the package's public exports. It is omitted from this text version; the code it demonstrates is in the surrounding sections.",
  );
}

interface CalloutProps {
  type?: "info" | "warn" | "error" | "success";
  title?: string;
  children?: ReactNode;
}

const CALLOUT_LABEL: Record<NonNullable<CalloutProps["type"]>, string> = {
  info: "Note",
  warn: "Warning",
  error: "Error",
  success: "Note",
};

interface StoriesProps {
  file: string;
  stories: readonly { name: string; proves: ReactNode }[];
}

interface TokenTableProps {
  prefix: string;
  px?: boolean;
}

interface MotionTableProps {
  prefix: "duration" | "easing" | "distance" | "scale";
}

interface AgentGuidanceProps {
  section: "source-of-truth" | "stop-conditions" | "repository-files";
}

type MarkdownComponent<P> = (props: P) => string | Promise<string>;

const markdown = {
  async Callout({ type = "info", title, children }: CalloutProps) {
    asMarkdown();
    const body = (await md.linePrefix("> ")`${children}`).trim();
    const label = title ?? CALLOUT_LABEL[type];
    return `\n> **${label}**\n>\n${body}\n\n`;
  },

  Prerelease() {
    asMarkdown();
    return `\n> **Prerelease**\n>\n> This page documents the component as it exists in the repository at package version ${code(version)}. ${code(packageName)} has not been published to the npm registry, so every API here is prerelease and may change before the first release. Nothing on this page is deprecated.\n\n`;
  },

  async Stories({ file, stories }: StoriesProps) {
    asMarkdown();
    const rows = await Promise.all(
      stories.map(async (story) => [code(story.name), await md`${story.proves}`]),
    );
    return (
      paragraph(
        `Story file: ${code(`${STORIES_DIR}/${file}`)}. Open it with ${code("pnpm dev:storybook")} from the repository, or serve the ${code("storybook-static-<sha>")} artifact that every CI run retains with ${code("pnpm review:storybook <path>")}.`,
      ) + table(["Story", "Proves"], rows)
    );
  },

  AgentGuidance({ section }: AgentGuidanceProps) {
    asMarkdown();
    switch (section) {
      case "source-of-truth":
        return `\n${SOURCE_OF_TRUTH_ORDER.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n\n${SOURCE_OF_TRUTH_RULE}\n\n`;
      case "stop-conditions":
        return `\n${STOP_CONDITIONS.map((item) => `- ${item}`).join("\n")}\n\n${STOP_RULE}\n\n`;
      case "repository-files":
        return table(
          ["Path", "Holds"],
          REPOSITORY_FILES.map((file) => [
            `[${code(file.path)}](${repositoryFileUrl(file.path)})`,
            file.holds,
          ]),
        );
    }
  },

  PackageExports() {
    asMarkdown();
    return table(
      ["Kind", "Exports from the package root"],
      groupExports(runtimeExportNames()).map(([kind, names]) => [kind, names.map(code).join(", ")]),
    );
  },

  ColorRoles({ group }: { group: string }) {
    asMarkdown();
    const roles = colorRoles(group);
    if (roles.length === 0) throw new Error(`No colour roles in group ${group}`);
    return table(
      ["Role", "Light", "Dark", "Custom property"],
      roles.map((role) => [
        code(role.role),
        `${code(role.light)} (${toHex(role.light)})`,
        `${code(role.dark)} (${toHex(role.dark)})`,
        code(role.variable),
      ]),
    );
  },

  ColorScale() {
    asMarkdown();
    return table(
      ["Family", ...STEPS.map(String)],
      FAMILIES.map((family) => [
        code(family),
        ...STEPS.map((step) => {
          const value = primitiveTokens[`color.${family}.${step}`];
          if (typeof value !== "string")
            throw new Error(`Missing primitive color.${family}.${step}`);
          return code(value);
        }),
      ]),
    );
  },

  ContrastMatrix() {
    asMarkdown();
    const measured = REQUIRED_PAIRINGS.map(measure);
    const failures = measured.filter((e) => e.light < e.required || e.dark < e.required);
    const kinds: PairingKind[] = ["body-text", "non-text", "disabled"];
    const ratio = (value: number, required: number) =>
      `${value.toFixed(2)}:1${value >= required ? "" : " fails"}`;
    let out = paragraph(
      `**${measured.length} required pairings**, ${measured.length * 2} checks across the two themes, ${failures.length === 0 ? "all passing" : `${failures.length} failing`}, measured from the committed token values.`,
    );
    for (const kind of kinds) {
      const rows = measured.filter((e) => e.pairing.kind === kind);
      if (rows.length === 0) continue;
      out += paragraph(`**${KIND_LABEL[kind]}**`);
      out += table(
        ["Foreground", "Background", "Light", "Dark", "Why it matters"],
        rows.map((e) => [
          code(shortRole(e.pairing.foreground)),
          code(shortRole(e.pairing.background)),
          ratio(e.light, e.required),
          ratio(e.dark, e.required),
          e.pairing.reason,
        ]),
      );
    }
    return out;
  },

  MotionTable({ prefix }: MotionTableProps) {
    asMarkdown();
    return table(
      ["Role", "Value", "Use", "Custom property", "Status"],
      motionRows(prefix).map((row) => [
        code(row.path),
        code(row.value),
        row.use,
        code(row.variable),
        row.status,
      ]),
    );
  },

  SpringTable() {
    asMarkdown();
    return table(
      ["Role", "Stiffness", "Damping", "Mass", "Character", "Status"],
      springRows().map((s) => [
        code(`springs.${s.name}`),
        String(s.stiffness),
        String(s.damping),
        String(s.mass),
        s.character,
        s.status,
      ]),
    );
  },

  EasingCurves() {
    asMarkdown();
    return (
      note("The page plots each curve. The values are:") +
      `${rolesUnder("easing")
        .map(({ path }) => `- ${code(path)}: ${code(scalar(path))}`)
        .join("\n")}\n\n`
    );
  },

  TokenTable({ prefix, px = false }: TokenTableProps) {
    asMarkdown();
    const roles = rolesUnder(prefix);
    if (roles.length === 0) throw new Error(`No semantic roles under ${prefix}`);
    const headers = px
      ? ["Role", "Value", "Pixels", "Custom property"]
      : ["Role", "Value", "Custom property"];
    return table(
      headers,
      roles.map(({ path, role, value }) => {
        const property = isSpring(value) ? "none, typed export only" : cssVariable(path);
        const cells = [code(`${prefix}.${role}`), code(display(value))];
        if (px) cells.push(typeof value === "string" ? remToPx(value) : "");
        cells.push(code(property));
        return cells;
      }),
    );
  },

  TypeTable() {
    asMarkdown();
    return table(
      ["Role", "Size", "Pixels", "Line height", "Weight", "Tracking", "Use"],
      typeRows().map((row) => [
        code(row.role),
        code(row.size),
        row.px,
        row.lineHeight,
        row.weight,
        row.tracking,
        row.use,
      ]),
    );
  },

  TypeSpecimens() {
    asMarkdown();
    return note(
      "The page sets every type role at real size here. The metrics are in the table under The roles below.",
    );
  },

  SpacingPrimitives() {
    asMarkdown();
    return table(
      ["Step", "Value", "Pixels"],
      primitiveSteps().map(([step, value]) => [code(`space.${step}`), code(value), remToPx(value)]),
    );
  },

  SpacingRoles() {
    asMarkdown();
    return note("The page draws each spacing role as a bar. The values are in the table below.");
  },

  RadiusSamples() {
    asMarkdown();
    return note("The page draws each radius role on a box. The values are in the table below.");
  },

  ElevationSamples() {
    asMarkdown();
    return table(
      ["Role", "Shadow", "Paired with"],
      rolesUnder("elevation").map(({ role, value }) => {
        const pair = ELEVATION_PAIRING[role] ?? { border: "border-border", surface: "bg-surface" };
        return [
          code(`elevation.${role}`),
          code(isShadow(value) ? shadowToCss(value) : String(value)),
          `${code(pair.border.replace("border-", ""))} on ${code(pair.surface.replace("bg-", ""))}`,
        ];
      }),
    );
  },

  ButtonRow: liveExample,
  ButtonDemo: liveExample,
  BadgeDemo: liveExample,
  CardDemo: liveExample,
  SeparatorDemo: liveExample,
  TextFieldsDemo: liveExample,
  SelectionControlsDemo: liveExample,
  SelectDemo: liveExample,
  DialogDemo: liveExample,
  TooltipDemo: liveExample,
  PopoverDemo: liveExample,
  TabsDemo: liveExample,
  MotionDemo: liveExample,
} satisfies Record<string, MarkdownComponent<never>>;

/**
 * The package's runtime export names, read from the compiled entry point on
 * disk rather than imported. The entry point re-exports `ThemeProvider` and
 * every context-bearing component, and the route layer rejects those imports
 * just as server components do (see `lib/tokens.ts`). The rendered page reads
 * the same list from the module itself in a client component; this reads the
 * file that module is, so the two cannot differ. It throws on a shape it does
 * not recognise, so a change to how the entry point is written fails the
 * build instead of quietly emptying the table.
 */
function runtimeExportNames(): string[] {
  const entry = resolve(process.cwd(), "node_modules/@iroshandezilva/spartant/dist/index.js");
  const text = readFileSync(entry, "utf8");
  if (/export\s+\*/.test(text)) {
    throw new Error(`${entry} uses export *, which this reader does not resolve`);
  }
  const names = new Set<string>();
  for (const match of text.matchAll(/export\s+(?:const|let|function|class)\s+([\w$]+)/g)) {
    names.add(match[1] as string);
  }
  for (const match of text.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const item of (match[1] as string).split(",")) {
      const name = item
        .trim()
        .split(/\s+as\s+/)
        .pop();
      if (name) names.add(name);
    }
  }
  if (names.size === 0) throw new Error(`No exports found in ${entry}`);
  return [...names];
}

/** The component map for `page.data.getText("processed", { components })`. */
export const markdownComponents = markdown as unknown as MDXComponents;
