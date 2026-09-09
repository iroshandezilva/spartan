import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Spartant's font sizes, as Tailwind's `text-*` namespace defines them.
 *
 * tailwind-merge has to be told these, and the reason is worth writing down
 * because the failure is silent. `text-*` is two class groups wearing one
 * prefix: a font size and a text colour. tailwind-merge separates them by
 * inspecting the value, and its built-in test only recognises the default
 * t-shirt sizes. `text-body` is not one, so it fell through to the colour
 * group, which accepts anything.
 *
 * The result was that a font size and a text colour landed in the same group
 * and the earlier one was discarded as a conflict. Every Button lost
 * `text-primary-foreground` to `text-body`, so labels rendered in the inherited
 * colour instead of the variant's; Badge lost `text-caption` to
 * `text-foreground` and rendered at inherited size. Nothing errored, no test
 * failed, and both looked plausible enough to miss.
 *
 * `cn.test.ts` reads these names back out of `theme.css`, so a size added to
 * the stylesheet without being added here fails rather than silently
 * reintroducing the bug.
 */
const FONT_SIZES = [
  "caption",
  "body-small",
  "body",
  "body-large",
  "heading-small",
  "heading",
  "heading-large",
  "display",
] as const;

/**
 * Colour role names, from the same stylesheet.
 *
 * Declared for the same reason, from the other side: naming them makes
 * `text-foreground` a colour by definition rather than by falling through, so
 * the two groups are decided by the theme rather than by a heuristic.
 */
const COLORS = [
  "background",
  "foreground",
  "foreground-muted",
  "foreground-inverse",
  "foreground-disabled",
  "surface",
  "surface-elevated",
  "surface-muted",
  "surface-disabled",
  "surface-selected",
  "border",
  "border-subtle",
  "border-strong",
  "focus-ring",
  "primary",
  "primary-hover",
  "primary-active",
  "primary-foreground",
  "primary-text",
  "primary-surface",
  "secondary",
  "secondary-hover",
  "secondary-active",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "accent-text",
  "accent-surface",
  "success",
  "success-foreground",
  "success-text",
  "success-surface",
  "warning",
  "warning-foreground",
  "warning-text",
  "warning-surface",
  "danger",
  "danger-hover",
  "danger-active",
  "danger-foreground",
  "danger-text",
  "danger-surface",
  "information",
  "information-foreground",
  "information-text",
  "information-surface",
] as const;

/** Radius, shadow, and easing roles. Same reasoning, smaller blast radius. */
const RADII = ["control", "surface", "pill"] as const;
const SHADOWS = ["flat", "surface", "overlay", "modal"] as const;
const EASINGS = ["enter", "exit", "move", "state", "progress"] as const;
const LEADINGS = ["body", "heading", "caption"] as const;
const TRACKINGS = ["body", "heading"] as const;
const SPACINGS = ["control-x", "control-y", "control-gap", "surface", "stack", "section"] as const;

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [...FONT_SIZES],
      color: [...COLORS],
      radius: [...RADII],
      shadow: [...SHADOWS],
      ease: [...EASINGS],
      leading: [...LEADINGS],
      tracking: [...TRACKINGS],
      spacing: [...SPACINGS],
    },
  },
});

/** The theme names this merger knows about, so a test can compare them to the stylesheet. */
export const MERGE_THEME = {
  text: FONT_SIZES,
  color: COLORS,
  radius: RADII,
  shadow: SHADOWS,
  ease: EASINGS,
  leading: LEADINGS,
  tracking: TRACKINGS,
  spacing: SPACINGS,
} as const;

/**
 * Merges class names, with later Tailwind utilities winning over earlier ones
 * in the same category.
 *
 * Every Spartant component composes its classes through `cn` and puts the
 * caller's `className` last. That is what makes `className` a reliable
 * override: passing `bg-danger` to a component whose default is `bg-primary`
 * removes the default rather than producing two competing background classes
 * whose winner depends on stylesheet order.
 *
 * @example
 * ```tsx
 * <div className={cn("bg-primary p-4", className)} />
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
