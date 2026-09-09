import type { Ref, RefObject } from "react";
import { useLayoutEffect, useState } from "react";
import { cn } from "../../lib/cn.js";

/**
 * Shared internals for the anchored overlays, Tooltip and Popover.
 *
 * Not exported from the package. Both components sit on the same two platform
 * features, decided in HAUX-53: the Popover API for the top layer, light
 * dismiss, and Escape, and CSS anchor positioning for placement and collision
 * handling. Everything here is the part of that decision the two components
 * genuinely share; the interaction models stay separate, because a tooltip and
 * a popover are different things and sharing more would blur them.
 */

/** Which side of the trigger the surface prefers. */
export type Placement = "top" | "bottom" | "left" | "right";

export const PLACEMENTS = [
  "top",
  "bottom",
  "left",
  "right",
] as const satisfies readonly Placement[];

/**
 * Placement through `position-area`, with the collision fallbacks that make it
 * hold at a viewport edge.
 *
 * A single `position-area` keyword spans all three tracks of the other axis, so
 * `top` centres the surface over its anchor. `position-try-fallbacks` is what
 * turns that into collision handling: the browser tries each entry in order and
 * keeps the first that fits. `flip-block` swaps to the opposite side when there
 * is no room; the `span-*` entries slide the surface so it hangs off one edge of
 * the anchor when centring would leave the viewport. All of it is evaluated by
 * the browser on every scroll and resize, with no listeners and no measuring.
 */
export const placementClasses: Record<Placement, string> = {
  top: "[position-area:top] [position-try-fallbacks:flip-block,top_span-left,top_span-right,bottom_span-left,bottom_span-right]",
  bottom:
    "[position-area:bottom] [position-try-fallbacks:flip-block,bottom_span-left,bottom_span-right,top_span-left,top_span-right]",
  left: "[position-area:left] [position-try-fallbacks:flip-inline,left_span-top,left_span-bottom,right_span-top,right_span-bottom]",
  right:
    "[position-area:right] [position-try-fallbacks:flip-inline,right_span-top,right_span-bottom,left_span-top,left_span-bottom]",
};

/**
 * What every anchored surface shares.
 *
 * The user-agent stylesheet gives a `[popover]` element `inset: 0` and
 * `margin: auto`, which centres it in the viewport. That is the right default
 * for an unanchored popover and the wrong one here: `position-area` aligns the
 * surface toward its anchor only when the insets are `auto`, so both are reset.
 * The margin then does two jobs: it is the gap between trigger and surface, and
 * because it is on every side it survives a fallback flip, where a one-sided
 * margin would leave the surface flush against the trigger.
 *
 * The transform origin follows `data-side`, which is the side the surface
 * actually landed on after fallbacks, so the entry grows from the trigger even
 * when the browser flipped the placement.
 */
export const anchoredSurface = cn(
  "fixed inset-auto m-control-gap",
  "data-[side=top]:origin-bottom data-[side=bottom]:origin-top",
  "data-[side=left]:origin-right data-[side=right]:origin-left",
);

/**
 * The `anchor-name` for a trigger, from its generated id.
 *
 * `anchor-name` takes a dashed identifier. `useId` returns a string with
 * delimiters that are not identifier characters in every React version, so they
 * are stripped; what remains is still unique per instance.
 */
export function anchorNameFor(id: string): `--spartant-anchor-${string}` {
  return `--spartant-anchor-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

/** Whether this environment has the Popover API at all. */
export function supportsPopoverApi(): boolean {
  return typeof HTMLElement !== "undefined" && "showPopover" in HTMLElement.prototype;
}

/**
 * Show or hide the surface through the Popover API, falling back to `hidden`
 * where the API is missing.
 *
 * The fallback exists for happy-dom, which reflects the `popover` attribute
 * and implements none of its behaviour, and for any browser that predates the
 * API. It has none of the platform's top layer or light dismiss; it is the
 * honest minimum that keeps the surface out of sight when closed.
 */
export function isShown(node: HTMLElement): boolean {
  if (typeof node.showPopover !== "function") return !node.hidden;
  return node.matches(":popover-open");
}

export function show(node: HTMLElement): void {
  if (typeof node.showPopover !== "function") {
    node.hidden = false;
    return;
  }
  // `showPopover()` throws on an element that is already open or not yet in
  // the document. Both are states this can legitimately be called from.
  if (node.isConnected && !node.matches(":popover-open")) node.showPopover();
}

export function hide(node: HTMLElement): void {
  if (typeof node.hidePopover !== "function") {
    node.hidden = true;
    return;
  }
  if (node.matches(":popover-open")) node.hidePopover();
}

/** The subset of `DOMRect` the side resolution reads, so it can be tested without a DOM. */
export interface Box {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

/**
 * The side the surface actually landed on, read back from geometry.
 *
 * CSS decides placement, including fallbacks, and CSS cannot tell the transform
 * origin which fallback won. So after the surface is shown its box is compared
 * with the anchor's: entirely above means `top`, and so on. When the geometry
 * says nothing, which is what a layout-less environment returns, the requested
 * placement stands.
 */
export function resolveSide(anchor: Box, surface: Box, requested: Placement): Placement {
  if (surface.width === 0 || surface.height === 0) return requested;
  if (surface.bottom <= anchor.top) return "top";
  if (surface.top >= anchor.bottom) return "bottom";
  if (surface.right <= anchor.left) return "left";
  if (surface.left >= anchor.right) return "right";
  return requested;
}

export interface AnchoredSurfaceOptions {
  open: boolean;
  placement: Placement;
  surfaceRef: RefObject<HTMLElement | null>;
  anchorRef: RefObject<HTMLElement | null>;
}

/**
 * Keeps the surface's shown state in step with `open`, and reports which side it
 * landed on.
 *
 * A layout effect on purpose. Showing the popover, reading its geometry, and
 * writing the resolved side all happen before the browser paints, so the first
 * frame of the entry transition already has the right origin. The starting
 * style is captured when the element is shown, and a later origin change does
 * not restart the transition, so this is the one order that gives a
 * trigger-origin entry without a frame from the wrong corner.
 *
 * The side is kept after close rather than reset, so the exit animation shrinks
 * toward the same trigger the entry grew from.
 */
export function useAnchoredSurface({
  open,
  placement,
  surfaceRef,
  anchorRef,
}: AnchoredSurfaceOptions): Placement {
  const [side, setSide] = useState<Placement | null>(null);

  useLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    if (open) {
      show(surface);
      const anchor = anchorRef.current;
      setSide(
        anchor
          ? resolveSide(anchor.getBoundingClientRect(), surface.getBoundingClientRect(), placement)
          : placement,
      );
    } else {
      hide(surface);
    }
  }, [open, placement, surfaceRef, anchorRef]);

  return side ?? placement;
}

/** Writes a node into a caller's ref, whichever shape it is. */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
}

/**
 * Elements that can take focus, in document order.
 *
 * Deliberately conservative: a positive `tabindex` and content editing are
 * covered, hidden inputs and disabled controls are not. Anything more elaborate
 * is a focus-management library, which this system has decided not to add.
 */
export const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
