import type { ComponentPropsWithoutRef, Ref } from "react";
import { cn } from "../../lib/cn.js";

/**
 * How the card separates from what is behind it.
 *
 * Both are pairings from `tokens/FOUNDATIONS.md`, not free choices. Elevation
 * is always paired with a border and a background, because in dark a shadow
 * against a dark surface is nearly invisible and in light `surface` is already
 * white, so each theme leans on a different cue and using both means neither
 * has to work alone.
 */
export type CardVariant = "raised" | "flat";

export interface CardProps extends ComponentPropsWithoutRef<"div"> {
  /** Points at the outer surface. */
  ref?: Ref<HTMLDivElement>;
  /**
   * How the card separates from its ground. Defaults to `raised`.
   *
   * `raised` is `elevation.surface` with `border.subtle`: a card sitting on
   * the page. `flat` is `elevation.flat` with `border`: a card inside another
   * surface, or one of many in a dense list, where a shadow on each would be
   * noise.
   */
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  raised: "border-border-subtle shadow-surface",
  flat: "border-border shadow-flat",
};

/**
 * A surface that groups related content.
 *
 * A `div`, and inert on purpose. A card is a container, not a control: it has
 * no role, no `tabIndex`, and no handlers of its own, so nothing inside it is
 * reachable except the controls the caller puts there. Making a whole card
 * clickable is a real pattern and a separate decision; it is out of scope
 * here, and a caller who needs it puts a real link or button inside the card
 * rather than adding a handler to the surface.
 *
 * The card is a grid with the stack gap between its children, so the parts
 * below fall into place with no per-part padding to keep in step. Padding lives
 * on the card, which means a part is only a box with type on it and can be
 * left out without leaving a hole.
 */
export function Card({ variant = "raised", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        // One column pinned to `minmax(0,1fr)`. A grid's auto column grows to
        // the longest word in any child, so an unbroken token in a title would
        // widen the track past the card and overflow the surface. Pinning the
        // column means the track can never exceed the card, which is what lets
        // `break-words` below actually break the word. Measured: at 2x root
        // font in a 320px viewport, the header overflowed by 121px without it.
        "grid grid-cols-[minmax(0,1fr)] gap-stack p-surface",
        "rounded-surface border bg-surface text-foreground",
        // `min-w-0` so the card can live in a flex row without refusing to
        // shrink, and `break-words` so a long unbroken token wraps inside it
        // instead of pushing the surface wider than its column.
        "min-w-0 break-words",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

export interface CardHeaderProps extends ComponentPropsWithoutRef<"div"> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * Groups a title and its description with the tighter control gap between
 * them, so the two read as one unit rather than as two stacked parts.
 */
export function CardHeader({ className, ...props }: CardHeaderProps) {
  // The same pinned column as the card, for the same reason: the title is the
  // part most likely to hold one long word.
  return (
    <div
      className={cn("grid min-w-0 grid-cols-[minmax(0,1fr)] gap-control-gap", className)}
      {...props}
    />
  );
}

/** Heading levels a card title can render as. */
export type CardTitleLevel = 2 | 3 | 4 | 5 | 6;

export interface CardTitleProps extends ComponentPropsWithoutRef<"h3"> {
  /** Points at the heading, whatever its level. */
  ref?: Ref<HTMLHeadingElement>;
  /**
   * The heading level. Defaults to 3.
   *
   * A card sits under a page title and usually under a section heading, which
   * is what makes 3 the honest default. It is a prop rather than fixed because
   * the outline belongs to the page: a card that is the main thing on a page
   * is a 2, and a card nested inside another card is a 4.
   */
  level?: CardTitleLevel;
}

/**
 * The card's title, as a real heading.
 *
 * Upstream renders a `div`, which looks identical and is invisible to anyone
 * navigating by headings. A heading is what makes a page of cards scannable
 * with a screen reader, and it costs nothing.
 */
export function CardTitle({ level = 3, className, ...props }: CardTitleProps) {
  const Heading = `h${level}` as const;
  return (
    <Heading
      className={cn(
        "text-heading-small leading-heading font-semibold tracking-heading text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export interface CardDescriptionProps extends ComponentPropsWithoutRef<"p"> {
  ref?: Ref<HTMLParagraphElement>;
}

/** Supporting text under the title. Muted, and still body text at 4.5:1. */
export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return <p className={cn("text-body-small text-foreground-muted", className)} {...props} />;
}

export interface CardContentProps extends ComponentPropsWithoutRef<"div"> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * The body. Adds nothing but a box, which is the point: the card's own gap
 * and padding already place it, so it exists to be a target for `className`
 * and a name in the tree rather than to impose a layout.
 */
export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn("min-w-0", className)} {...props} />;
}

export interface CardActionsProps extends ComponentPropsWithoutRef<"div"> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * A row of controls.
 *
 * Wraps rather than overflows, so two buttons in a 320px column stack instead
 * of escaping the surface. Left-aligned by default; a caller who wants the
 * actions at the trailing edge says `justify-end`.
 */
export function CardActions({ className, ...props }: CardActionsProps) {
  return (
    <div
      className={cn("flex min-w-0 flex-wrap items-center gap-control-gap", className)}
      {...props}
    />
  );
}
