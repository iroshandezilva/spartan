import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { type ComponentProps, isValidElement, type ReactNode } from "react";
import { BadgeDemo } from "./demo/BadgeDemo";
import { ButtonDemo } from "./demo/ButtonDemo";
import { ButtonRow } from "./demo/ButtonRow";
import { CardDemo } from "./demo/CardDemo";
import { DialogDemo } from "./demo/DialogDemo";
import { MotionDemo } from "./demo/MotionDemo";
import { PopoverDemo } from "./demo/PopoverDemo";
import { SelectDemo } from "./demo/SelectDemo";
import { SelectionControlsDemo } from "./demo/SelectionControlsDemo";
import { SeparatorDemo } from "./demo/SeparatorDemo";
import { TabsDemo } from "./demo/TabsDemo";
import { TextFieldsDemo } from "./demo/TextFieldsDemo";
import { TooltipDemo } from "./demo/TooltipDemo";
import { AgentGuidance } from "./docs/AgentGuidance";
import { Prerelease } from "./docs/Prerelease";
import { Stories } from "./docs/Stories";
import { ColorRoles } from "./foundation/ColorRoles";
import { ColorScale } from "./foundation/ColorScale";
import { ContrastMatrix } from "./foundation/ContrastMatrix";
import { EasingCurves, MotionTable, SpringTable } from "./foundation/MotionTokens";
import { PackageExports } from "./foundation/PackageExports";
import { ElevationSamples, RadiusSamples } from "./foundation/ShapeSamples";
import { SpacingPrimitives, SpacingRoles } from "./foundation/SpacingScale";
import { TokenTable } from "./foundation/TokenTable";
import { TypeSpecimens, TypeTable } from "./foundation/TypeSpecimens";

/** Components available to every MDX page without an import.
 *
 * Fumadocs' defaults supply the prose, callout, and code-block elements.
 * Anything added here is either a Spartant example, which must be a real
 * component from the package's public entry point rather than a lookalike, or
 * a foundation specimen that reads the published token JSON. Either way a
 * broken example fails the build instead of quietly documenting something
 * that does not exist. */
/**
 * A table in a scroll container that a keyboard can reach.
 *
 * Fumadocs wraps every table in `overflow-auto`, which at a narrow viewport
 * scrolls sideways under a pointer and not at all from a keyboard, because the
 * wrapper is not focusable (axe: scrollable-region-focusable, at 360px). The
 * wrapper here takes focus, and carries a role and a name so that focus lands
 * on something a screen reader can announce. `group` rather than `region`,
 * because a region is a landmark, and a page with four tables would have four
 * identically named landmarks.
 */
function Table(props: ComponentProps<"table">) {
  return (
    <div
      role="group"
      aria-label="Scrollable table"
      tabIndex={0}
      className="relative my-6 overflow-auto prose-no-margin rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
    >
      <table {...props} />
    </div>
  );
}

/** The text inside a React tree, in document order. */
function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

/**
 * A code block whose scroll region has a name.
 *
 * Fumadocs renders every code block's viewport as a focusable `role="region"`
 * with no accessible name. Several on one page are several identical,
 * nameless landmarks (axe: landmark-unique, in a real browser as well as in
 * the audit). The name is the block's title when it has one, else its first
 * line, which is how a sighted reader tells one block from the next too.
 */
function NamedCodeBlock({ title, children, ...props }: ComponentProps<"pre"> & { title?: string }) {
  const firstLine = textOf(children).split("\n").find((line) => line.trim() !== "")?.trim() ?? "";
  const label = title ? `Code, ${title}` : `Code, ${firstLine.slice(0, 72)}`;
  return (
    <CodeBlock {...props} title={title} viewportProps={{ "aria-label": label }}>
      <Pre>{children}</Pre>
    </CodeBlock>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: NamedCodeBlock,
    table: Table,
    ButtonRow,
    ButtonDemo,
    BadgeDemo,
    CardDemo,
    SeparatorDemo,
    TextFieldsDemo,
    SelectionControlsDemo,
    SelectDemo,
    DialogDemo,
    TooltipDemo,
    PopoverDemo,
    TabsDemo,
    AgentGuidance,
    Prerelease,
    Stories,
    MotionDemo,
    ColorRoles,
    ColorScale,
    ContrastMatrix,
    EasingCurves,
    MotionTable,
    SpringTable,
    PackageExports,
    RadiusSamples,
    ElevationSamples,
    SpacingPrimitives,
    SpacingRoles,
    TokenTable,
    TypeSpecimens,
    TypeTable,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;
