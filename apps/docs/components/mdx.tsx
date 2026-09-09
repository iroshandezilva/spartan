import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";
import { ButtonRow } from "./demo/ButtonRow";
import { MotionDemo } from "./demo/MotionDemo";
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
export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    ButtonRow,
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
