import type { ComponentPropsWithoutRef, ReactNode, Ref, RefObject } from "react";
import { createContext, use, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn.js";
import {
  anchoredSurface,
  anchorNameFor,
  assignRef,
  type Placement,
  placementClasses,
  useAnchoredSurface,
} from "../popover/overlay.js";

/** How long a pointer rests on the trigger before the tooltip opens. Focus never waits. */
const DEFAULT_DELAY = 500;

/**
 * After one tooltip closes, another opened within this window skips the delay
 * and the entry animation. The motion standard's baseline for tooltips:
 * "sequential tooltips open without repeated delay or animation".
 */
const SKIP_DELAY_WINDOW = 300;

/**
 * When the last tooltip on the page closed.
 *
 * Module-level on purpose. Whether a user is sweeping across a toolbar is a
 * property of the page, not of any React subtree, and a context provider would
 * have to be threaded around every toolbar to say the same thing. It is only
 * ever read and written inside event handlers, so it is safe on the server.
 */
let lastClosedAt = 0;

interface TooltipContextValue {
  open: boolean;
  instant: boolean;
  contentId: string;
  anchorName: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
  scheduleOpen: () => void;
  openNow: () => void;
  close: () => void;
}

/** Not exported. A part outside its `Tooltip` throws with a message naming both. */
const TooltipContext = createContext<TooltipContextValue | null>(null);

function useTooltip(part: string): TooltipContextValue {
  const context = use(TooltipContext);
  if (!context) {
    throw new Error(`${part} must be rendered inside a Tooltip.`);
  }
  return context;
}

export interface TooltipProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. Defaults to closed. */
  defaultOpen?: boolean;
  /** Called with the new open state, from any path that changes it. */
  onOpenChange?: (open: boolean) => void;
  /**
   * Milliseconds a pointer must rest on the trigger before the tooltip opens.
   *
   * Prevents a sweep across a toolbar from flashing every tooltip in turn.
   * Focus ignores it: a keyboard user asked for the control, not the way to it.
   * Defaults to 500.
   */
  delay?: number;
  children?: ReactNode;
}

/**
 * Brief supplemental text for a control.
 *
 * Built on the Popover API in `manual` mode, which is the HAUX-53 decision:
 * the platform supplies the top layer, so the tooltip paints above everything
 * with no portal and no `z-index`, and CSS anchor positioning places it beside
 * its trigger with collision handling the browser re-evaluates on every scroll.
 * Nothing about when it opens is left to the platform, because a tooltip's
 * timing is the whole of its behaviour and it belongs to the component.
 *
 * A tooltip is never the only source of essential information. The trigger
 * must have its own accessible name; the tooltip is its description, linked
 * through `aria-describedby`, and it holds no interactive content.
 */
export function Tooltip({
  open,
  defaultOpen = false,
  onOpenChange,
  delay = DEFAULT_DELAY,
  children,
}: TooltipProps) {
  const generated = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const [instant, setInstant] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

  /*
   * The state as of the last call, not the last render. Hover and focus can
   * both fire before React re-renders, and each needs to know whether the
   * other already opened the tooltip, so `onOpenChange` fires once per change.
   */
  const latest = useRef(isOpen);
  useEffect(() => {
    latest.current = isOpen;
  }, [isOpen]);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      if (latest.current === next) return;
      latest.current = next;
      if (!next) lastClosedAt = Date.now();
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  /** Focus path. Immediate, and with the entry animation. */
  const openNow = useCallback(() => {
    clearTimer();
    setInstant(false);
    setOpen(true);
  }, [clearTimer, setOpen]);

  /** Hover path. Delayed, unless another tooltip just closed. */
  const scheduleOpen = useCallback(() => {
    if (latest.current) return;
    clearTimer();
    // A clock that went backwards is not a tooltip that just closed.
    const sinceLastClose = Date.now() - lastClosedAt;
    if (sinceLastClose >= 0 && sinceLastClose < SKIP_DELAY_WINDOW) {
      setInstant(true);
      setOpen(true);
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      // A timer that fires in a background tab would open a tooltip nobody is
      // pointing at, which the motion standard's timed-state rule forbids.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      setInstant(false);
      setOpen(true);
    }, delay);
  }, [clearTimer, delay, setOpen]);

  const close = useCallback(() => {
    clearTimer();
    setOpen(false);
  }, [clearTimer, setOpen]);

  useEffect(() => clearTimer, [clearTimer]);

  /*
   * Escape dismisses from anywhere, not only from the trigger. A tooltip opened
   * by hover has no focus relationship to lean on, so the listener is on the
   * document while it is open and gone the moment it closes. The key is
   * consumed so an enclosing dialog does not close on the same press: the
   * innermost thing dismisses first.
   */
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      event.preventDefault();
      close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  return (
    <TooltipContext
      value={{
        open: isOpen,
        instant,
        contentId: `${generated}-tooltip`,
        anchorName: anchorNameFor(generated),
        triggerRef,
        scheduleOpen,
        openNow,
        close,
      }}
    >
      {children}
    </TooltipContext>
  );
}

export interface TooltipTriggerProps extends ComponentPropsWithoutRef<"button"> {
  ref?: Ref<HTMLButtonElement>;
}

/**
 * The control the tooltip describes.
 *
 * A native `button`, and it must carry its own accessible name: an icon-only
 * trigger needs `aria-label`, because the tooltip is the description and a
 * description is not a name.
 *
 * `disabled` is translated rather than passed through. A natively disabled
 * button cannot be focused and does not reliably receive pointer events, so its
 * tooltip could never open, and a tooltip explaining why a control is
 * unavailable is the most common reason to put one on a disabled control. The
 * trigger therefore stays focusable, carries `aria-disabled`, and swallows
 * activation, which is the same treatment `Button` gives its loading state.
 */
export function TooltipTrigger({
  ref,
  disabled,
  style,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onPointerUp,
  onFocus,
  onBlur,
  onClick,
  ...props
}: TooltipTriggerProps) {
  const { contentId, anchorName, triggerRef, scheduleOpen, openNow, close } =
    useTooltip("TooltipTrigger");

  /*
   * A click focuses the trigger, and focus opens the tooltip immediately. That
   * is right for the keyboard and wrong for the mouse, where the hover path is
   * already handling it and activation should dismiss rather than open. A
   * pointer press sets this so the focus that follows it is ignored. Touch is
   * excluded on purpose: a tap is the only way a touch user reaches the focus
   * path, and on platforms that focus a button on tap it is how they get the
   * tooltip at all.
   */
  const skipNextFocus = useRef(false);

  return (
    <button
      ref={(node) => {
        triggerRef.current = node;
        assignRef(ref, node);
      }}
      type="button"
      aria-describedby={contentId}
      aria-disabled={disabled || undefined}
      data-disabled={disabled ? "" : undefined}
      style={{ anchorName, ...style }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        if (event.pointerType !== "touch") scheduleOpen();
      }}
      onPointerLeave={(event) => {
        onPointerLeave?.(event);
        close();
      }}
      onPointerDown={(event) => {
        onPointerDown?.(event);
        if (event.pointerType === "touch") return;
        skipNextFocus.current = true;
        close();
      }}
      onPointerUp={(event) => {
        onPointerUp?.(event);
        skipNextFocus.current = false;
      }}
      onFocus={(event) => {
        onFocus?.(event);
        if (skipNextFocus.current) {
          skipNextFocus.current = false;
          return;
        }
        openNow();
      }}
      onBlur={(event) => {
        onBlur?.(event);
        close();
      }}
      onClick={(event) => {
        if (disabled) {
          // Covers Enter and Space too: both dispatch a click on a native button.
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      {...props}
    />
  );
}

export interface TooltipContentProps extends ComponentPropsWithoutRef<"div"> {
  ref?: Ref<HTMLDivElement>;
  /** Which side of the trigger to prefer. The browser flips it when there is no room. Defaults to `top`. */
  placement?: Placement;
}

const surface = cn(
  anchoredSurface,
  "w-max max-w-[var(--spartant-tooltip-max-width)] wrap-break-word",
  "rounded-control border-0 bg-foreground text-foreground-inverse shadow-overlay",
  "px-[var(--spartant-tooltip-padding-x)] py-[var(--spartant-tooltip-padding-y)]",
  "font-sans text-body-small leading-body",
  // Never interactive, and never in the way: the pointer passes through it to
  // whatever is underneath, so it cannot steal the hover that opened it.
  "pointer-events-none select-none",
  // Entry and exit. The closed state carries the exit timing and the open
  // state the entry timing, because a transition runs on the timing of the
  // state it is moving into. Fast timing for both, per the motion standard:
  // `state-change` aliases the fast step and `press-feedback` is the only
  // faster role, which keeps the exit ahead of the entry.
  "opacity-0 scale-[var(--spartant-scale-overlay-enter)]",
  "open:opacity-100 open:scale-100",
  "starting:open:opacity-0 starting:open:scale-[var(--spartant-scale-overlay-enter)]",
  "transition-[opacity,scale,display,overlay] transition-discrete",
  "duration-press ease-exit open:duration-state open:ease-enter",
  // A sequential tooltip appears in place of the last one, with no animation.
  "data-instant:transition-none",
);

/**
 * The tooltip text.
 *
 * `role="tooltip"`, always in the document so the trigger's `aria-describedby`
 * never dangles, and shown through the Popover API so it sits in the top layer.
 * `popover="manual"` because the platform's light dismiss is for things a user
 * opened on purpose; a tooltip closes when the reason for it goes away, and
 * the trigger already knows when that is.
 */
export function TooltipContent({
  ref,
  placement = "top",
  className,
  style,
  children,
  ...props
}: TooltipContentProps) {
  const { open, instant, contentId, anchorName, triggerRef } = useTooltip("TooltipContent");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const side = useAnchoredSurface({ open, placement, surfaceRef, anchorRef: triggerRef });

  return (
    <div
      ref={(node) => {
        surfaceRef.current = node;
        assignRef(ref, node);
      }}
      id={contentId}
      role="tooltip"
      popover="manual"
      data-state={open ? "open" : "closed"}
      data-side={side}
      data-instant={instant ? "" : undefined}
      style={{ positionAnchor: anchorName, ...style }}
      className={cn(surface, placementClasses[placement], className)}
      {...props}
    >
      {children}
    </div>
  );
}
