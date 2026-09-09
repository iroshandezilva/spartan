import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn.js";

export interface SeparatorProps extends ComponentPropsWithoutRef<"div"> {
  /** Which way the line runs. Defaults to `horizontal`. */
  orientation?: "horizontal" | "vertical";
  /**
   * Whether the separator carries meaning.
   *
   * Decorative by default, which is the honest default: most rules in a layout
   * are drawn because a gap alone looked thin, and announcing every one of them
   * is noise. Set `decorative={false}` when the line genuinely divides two
   * groups a screen-reader user needs to know are separate.
   */
  decorative?: boolean;
}

/**
 * A dividing line.
 *
 * Renders a `div` rather than an `hr`. `hr` is a thematic break between
 * paragraph-level content and carries that meaning whether or not it fits, and
 * it cannot be vertical without fighting its own default styling. A `div` with
 * `role="separator"` says exactly as much as is true, and nothing when the line
 * is decorative.
 */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      // A decorative line is removed from the accessibility tree entirely.
      // `role="none"` alone would leave it present but unnamed.
      {...(decorative
        ? { "aria-hidden": true, role: "none" }
        : { role: "separator", "aria-orientation": orientation })}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal"
          ? "h-[var(--spartant-border-width)] w-full"
          : "h-full w-[var(--spartant-border-width)]",
        className,
      )}
      {...props}
    />
  );
}
