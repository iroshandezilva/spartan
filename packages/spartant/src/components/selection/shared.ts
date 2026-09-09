import { cn } from "../../lib/cn.js";

/**
 * A centred 44px hit area on coarse pointers, without changing the layout.
 *
 * The same technique Button uses, and the same reason: a 20px checkbox is the
 * right size to look at and the wrong size to hit with a thumb. The
 * pseudo-element is absolutely positioned so it never affects layout, and
 * `max()` means it can only ever grow the target.
 *
 * Gated on `pointer: coarse` so an invisible 44px target does not sit over a
 * neighbouring row in a mouse-driven list.
 */
export const coarseHitArea = cn(
  "relative",
  "pointer-coarse:after:absolute pointer-coarse:after:left-1/2 pointer-coarse:after:top-1/2",
  "pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
  "pointer-coarse:after:content-['']",
  "pointer-coarse:after:h-[max(100%,var(--spartant-size-min-target))]",
  "pointer-coarse:after:w-[max(100%,var(--spartant-size-min-target))]",
);

/** Everything the three controls share: focus, disabled, and invalid. */
export const controlBase = cn(
  "shrink-0 appearance-none border border-border-strong bg-surface",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  "disabled:cursor-not-allowed disabled:border-border disabled:bg-surface-disabled",
  "aria-invalid:border-danger",
  // Hover is a declared state for this family, so it has to exist. Colour only,
  // and only where a pointer can actually hover.
  "hover:not-disabled:border-foreground-muted",
  // Colour and the indicator only. Nothing here moves its neighbours.
  "transition-[background-color,border-color] duration-state ease-state",
);
