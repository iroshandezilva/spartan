import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn.js";

/**
 * ADAPTED FROM shadcn/ui `badge`, new-york style.
 * Upstream snapshot and provenance: ./upstream/
 *
 * Experiment evidence for HAUX-65, not a released component. HAUX-45 owns the
 * real Badge and may start from this source once HAUX-44 fixes the shared API
 * conventions. Deliberately not exported from the package entry point.
 *
 * What changed from upstream, and why:
 *
 * 1. `@radix-ui/react-slot` was declared as a dependency and never imported.
 *    Dropped. The registry over-declares; the review step exists to catch that.
 * 2. `cva` was replaced by a plain lookup object. A dependency to pick one of
 *    four strings is not worth a runtime dependency in a package whose whole
 *    point is a small consumer footprint.
 * 3. `<div>` became `<span>`. A badge sits inside a sentence or a table cell;
 *    a block element there is wrong, and the upstream default forces every
 *    consumer to override it.
 * 4. `focus:ring-2` became `focus-visible:outline-2`. `focus:` shows the ring
 *    on mouse click, which trains people to ignore it.
 * 5. `destructive` became `danger`, matching Spartant's semantic role names.
 * 6. `hover:bg-primary/80` became `hover:bg-primary-hover`. An opacity shortcut
 *    produces a different colour on every surface it sits on, and it is not a
 *    reviewable contrast pairing. Spartant has a hover role for this.
 * 7. Raw `rounded-md`, `text-xs`, `px-2.5 py-0.5` became semantic tokens.
 */

export type BadgeTone = "primary" | "secondary" | "danger" | "outline";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /** Semantic role the badge carries. Defaults to `primary`. */
  tone?: BadgeTone;
}

/**
 * Tone lookup: complete class strings, keyed by role.
 *
 * This is the documented variant convention. It replaces `cva` with no loss:
 * `cva` earns its place when variants compose along several axes, which a
 * badge does not do.
 */
const toneClasses: Record<BadgeTone, string> = {
  primary: "border-transparent bg-primary text-primary-foreground hover:bg-primary-hover",
  secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary-hover",
  danger: "border-transparent bg-danger text-danger-foreground",
  outline: "border-border text-foreground",
};

export function Badge({ tone = "primary", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-3 py-0.5",
        "text-caption font-medium",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
