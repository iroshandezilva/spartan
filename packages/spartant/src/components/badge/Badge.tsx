import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn.js";

/**
 * What the badge means, never what colour it is.
 *
 * `neutral` is the default because most badges are categories rather than
 * statuses, and reaching for a status colour to label a category is how a red
 * chip ends up meaning "Design" instead of "Failed".
 */
export type BadgeVariant =
  | "neutral"
  | "primary"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "information";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /** What the badge means. Defaults to `neutral`. */
  variant?: BadgeVariant;
}

/**
 * Tint and text per variant.
 *
 * Every variant is the `surface` and `text` pair of one colour family, which is
 * the pairing the contrast check validates. The two are never mixed across
 * families, so there is no combination a caller can reach that has not been
 * measured in both themes.
 *
 * No border, and that is a measured decision rather than a taste one. The tints
 * separate from the page background and from a card by 1.08 to 1.17 in both
 * themes, which is faint by design and enough to read as a shape;
 * `tooling/tokens/tint-separation.test.ts` holds that floor. They shipped at
 * 1.00 against one ground in each theme, meaning invisible in greyscale, until
 * building this component surfaced it. See `./README.md` for the one ground
 * where the collision remains.
 */
const variantClasses: Record<BadgeVariant, string> = {
  // Neutral has no family of its own, so it uses the surface and foreground
  // roles directly. `foreground` rather than `foreground-muted`: the chip is
  // already quiet, and muting the text as well takes it below the ratio the
  // other variants hold.
  neutral: "bg-surface-muted text-foreground",
  primary: "bg-primary-surface text-primary-text",
  accent: "bg-accent-surface text-accent-text",
  success: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  danger: "bg-danger-surface text-danger-text",
  information: "bg-information-surface text-information-text",
};

/**
 * A compact label for a status or a category.
 *
 * A `span`, and inert on purpose. A badge that can be clicked is a button, and
 * a badge that can be dismissed is a button inside a badge. Neither is this
 * component's job: it carries no `tabIndex`, no role, and no handlers of its
 * own, so composing it into something interactive is a deliberate act by the
 * caller rather than something the component quietly permits.
 *
 * The label is the accessible name, and it has to say what it means on its own.
 * A colour is not a name: a red chip reading "3" tells a screen-reader user
 * nothing, and tells a colour-blind user nothing either. Write "3 failed".
 */
export function Badge({ variant = "neutral", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        // `inline-flex` so an icon and its label share a baseline-ish centre,
        // and `align-middle` so the chip itself centres on the text line it
        // sits in rather than on that line's baseline.
        "inline-flex items-center align-middle",
        "gap-[var(--spartant-badge-gap)]",
        "px-[var(--spartant-badge-padding-x)] py-[var(--spartant-badge-padding-y)]",
        "rounded-pill font-sans font-medium",
        "text-caption leading-caption",
        // Deliberately no `whitespace-nowrap`. A long label wraps inside the
        // chip instead of running off the edge of a narrow column, and the
        // pill radius stays correct because it is larger than any height the
        // chip can reach.
        "min-w-0 break-words",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
