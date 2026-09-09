import type { ComponentPropsWithoutRef, ReactNode, Ref, RefObject } from "react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../../lib/cn.js";
import {
  anchoredSurface,
  anchorNameFor,
  assignRef,
  FOCUSABLE,
  type Placement,
  placementClasses,
  supportsPopoverApi,
  useAnchoredSurface,
} from "./overlay.js";

interface PopoverContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  contentId: string;
  titleId: string;
  descriptionId: string;
  anchorName: string;
  hasTitle: boolean;
  registerTitle: (present: boolean) => void;
  hasDescription: boolean;
  registerDescription: (present: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

/** Not exported. A part outside its `Popover` throws with a message naming both. */
const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopover(part: string): PopoverContextValue {
  const context = use(PopoverContext);
  if (!context) {
    throw new Error(`${part} must be rendered inside a Popover.`);
  }
  return context;
}

export interface PopoverProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. Defaults to closed. */
  defaultOpen?: boolean;
  /** Called with the new open state, from any dismissal path. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/**
 * Richer, interactive content anchored to a trigger, without taking over the
 * page.
 *
 * Built on the Popover API in `auto` mode, which is the HAUX-53 decision. The
 * platform supplies the top layer, light dismiss on outside interaction,
 * Escape, and focus restoration to the invoker, with no dependency and no
 * portal. CSS anchor positioning places the surface beside its trigger and
 * handles viewport collisions on every scroll and resize without a listener.
 *
 * What Spartant owns is what the platform leaves open: the surface styling
 * from tokens, the entry and exit motion, moving focus into the surface when it
 * has something to focus, and naming it so it announces as a dialog rather
 * than as a group of unexplained controls.
 */
export function Popover({ open, defaultOpen = false, onOpenChange, children }: PopoverProps) {
  const generated = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

  /*
   * The platform reports every change through the `toggle` event, including
   * the ones this component asked for. Comparing against the last intended
   * state, rather than the last rendered one, is what keeps `onOpenChange`
   * to one call per change when the event lands before React re-renders.
   */
  const latest = useRef(isOpen);
  useEffect(() => {
    latest.current = isOpen;
  }, [isOpen]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (latest.current === next) return;
      latest.current = next;
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <PopoverContext
      value={{
        open: isOpen,
        setOpen,
        contentId: `${generated}-popover`,
        titleId: `${generated}-title`,
        descriptionId: `${generated}-description`,
        anchorName: anchorNameFor(generated),
        hasTitle,
        registerTitle: setHasTitle,
        hasDescription,
        registerDescription: setHasDescription,
        triggerRef,
      }}
    >
      {children}
    </PopoverContext>
  );
}

export interface PopoverTriggerProps extends ComponentPropsWithoutRef<"button"> {
  ref?: Ref<HTMLButtonElement>;
}

/**
 * Opens and closes the popover.
 *
 * `popovertarget` is what makes this the platform's invoker rather than a
 * button that happens to call `showPopover()`. The difference matters: an
 * invoker is exempt from light dismiss, so a click on it while the popover is
 * open toggles it closed instead of dismissing and immediately reopening. It
 * also makes the trigger the popover's implicit anchor and gives the button an
 * expanded state in the accessibility tree.
 *
 * A natively `disabled` trigger cannot invoke, which is the correct behaviour
 * for a popover: unlike a tooltip, it has nothing to say about why.
 */
export function PopoverTrigger({ ref, style, onClick, onKeyDown, ...props }: PopoverTriggerProps) {
  const { open, setOpen, contentId, anchorName, triggerRef } = usePopover("PopoverTrigger");

  return (
    <button
      ref={(node) => {
        triggerRef.current = node;
        assignRef(ref, node);
      }}
      type="button"
      popoverTarget={contentId}
      aria-expanded={open}
      aria-haspopup="dialog"
      style={{ anchorName, ...style }}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        // Where the platform cannot toggle for us, the click does it directly.
        if (!supportsPopoverApi()) setOpen(!open);
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // Escape while focus stayed on the trigger, for the case where the
        // surface had nothing to focus. The platform does this too; the key
        // is consumed so it is not done twice.
        if (event.key === "Escape" && open && !event.defaultPrevented) {
          event.preventDefault();
          setOpen(false);
        }
      }}
      {...props}
    />
  );
}

export interface PopoverContentProps extends ComponentPropsWithoutRef<"div"> {
  ref?: Ref<HTMLDivElement>;
  /** Which side of the trigger to prefer. The browser flips it when there is no room. Defaults to `bottom`. */
  placement?: Placement;
}

const surface = cn(
  anchoredSurface,
  "w-[var(--spartant-popover-width)] max-w-[calc(100vw-var(--spartant-space-stack-gap))]",
  "rounded-surface border border-border bg-surface-elevated text-foreground shadow-overlay",
  "p-[var(--spartant-popover-padding)] font-sans text-body",
  // Entry and exit. The closed state carries the exit timing and the open
  // state the entry timing, because a transition runs on the timing of the
  // state it is moving into. This is the first consumer of the overlay
  // durations and of `easing.exit`.
  "opacity-0 scale-[var(--spartant-scale-overlay-enter)]",
  "open:opacity-100 open:scale-100",
  "starting:open:opacity-0 starting:open:scale-[var(--spartant-scale-overlay-enter)]",
  "transition-[opacity,scale,display,overlay] transition-discrete",
  "duration-overlay-exit ease-exit open:duration-overlay-enter open:ease-enter",
);

/**
 * The surface.
 *
 * `role="dialog"`, non-modal: the page behind it stays live, which is what
 * separates a popover from a Dialog. It is named by `PopoverTitle` or by an
 * `aria-label` the caller supplies, and the accessibility audit fails a
 * popover with neither.
 *
 * The exit animates, and that is not in tension with the rule that focus
 * never waits for motion. `hidePopover()` restores focus and fires its events
 * at once; the surface merely stays painted, out of the accessibility tree,
 * for the length of the exit transition. Dialog could not do this because
 * `close()` removes the element from view instantly; the Popover API keeps
 * `overlay` and `display` transitionable, which is the whole reason the exit
 * roles finally have a consumer.
 */
export function PopoverContent({
  ref,
  placement = "bottom",
  className,
  style,
  children,
  onToggle,
  onKeyDown,
  ...props
}: PopoverContentProps) {
  const {
    open,
    setOpen,
    contentId,
    titleId,
    descriptionId,
    anchorName,
    hasTitle,
    hasDescription,
    triggerRef,
  } = usePopover("PopoverContent");
  const surfaceRef = useRef<HTMLDivElement>(null);
  const side = useAnchoredSurface({ open, placement, surfaceRef, anchorRef: triggerRef });

  /*
   * Focus in on open, back out on close.
   *
   * On open, focus moves to the first focusable element, or to whatever the
   * caller marked `autofocus`, and only when there is one: a popover that is
   * all text leaves focus on the trigger, where Escape still reaches it. On
   * close, focus returns to the trigger unless the user already put it
   * somewhere else, which is what an outside click does and what a popover
   * must not undo. The platform restores focus too, when focus was inside;
   * this covers the browsers and the paths where it does not.
   */
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    const node = surfaceRef.current;
    if (!node) return;
    if (open) {
      if (!node.contains(document.activeElement)) {
        const target =
          node.querySelector<HTMLElement>("[autofocus]") ??
          node.querySelector<HTMLElement>(FOCUSABLE);
        target?.focus();
      }
    } else if (wasOpen.current) {
      const active = document.activeElement;
      const trigger = triggerRef.current;
      if (trigger && (!active || active === document.body || node.contains(active))) {
        trigger.focus();
      }
    }
    wasOpen.current = open;
  }, [open, triggerRef]);

  /*
   * Outside interaction.
   *
   * With the Popover API present, `popover="auto"` light-dismisses on its own,
   * on a trusted pointer. This listener runs alongside it rather than only in
   * its absence: it makes the behaviour hold in an environment without the
   * API, and under the untrusted events a test dispatches, and the two never
   * disagree because both end in the same state and the dedupe absorbs the
   * second report. A press inside the surface or on the trigger is not
   * outside; the trigger is the invoker, and toggles on its own.
   */
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (surfaceRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, setOpen, triggerRef]);

  return (
    <div
      ref={(node) => {
        surfaceRef.current = node;
        assignRef(ref, node);
      }}
      id={contentId}
      role="dialog"
      popover="auto"
      aria-labelledby={hasTitle ? titleId : undefined}
      aria-describedby={hasDescription ? descriptionId : undefined}
      data-state={open ? "open" : "closed"}
      data-side={side}
      style={{ positionAnchor: anchorName, ...style }}
      /*
       * `toggle` fires for every path the platform owns: light dismiss, Escape,
       * the invoker, and `showPopover()` and `hidePopover()` themselves.
       * Syncing here rather than in each handler means no path can change the
       * surface without the state following.
       */
      onToggle={(event) => {
        onToggle?.(event);
        setOpen(event.newState === "open");
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (event.key === "Escape" && !event.defaultPrevented) {
          event.preventDefault();
          setOpen(false);
        }
      }}
      className={cn(surface, placementClasses[placement], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PopoverTitleProps extends ComponentPropsWithoutRef<"h2"> {
  ref?: Ref<HTMLHeadingElement>;
}

/**
 * The accessible name.
 *
 * Render it, or give `PopoverContent` an `aria-label`. A popover with neither
 * announces as an unnamed dialog, which tells a screen-reader user that
 * something opened and not what.
 */
export function PopoverTitle({ id, className, ...props }: PopoverTitleProps) {
  const { titleId, registerTitle } = usePopover("PopoverTitle");

  useEffect(() => {
    registerTitle(true);
    return () => registerTitle(false);
  }, [registerTitle]);

  return (
    <h2
      id={id ?? titleId}
      className={cn("text-heading-small font-semibold tracking-heading text-foreground", className)}
      {...props}
    />
  );
}

export interface PopoverDescriptionProps extends ComponentPropsWithoutRef<"p"> {
  ref?: Ref<HTMLParagraphElement>;
}

/** Optional supporting text, announced after the name. */
export function PopoverDescription({ id, className, ...props }: PopoverDescriptionProps) {
  const { descriptionId, registerDescription } = usePopover("PopoverDescription");

  useEffect(() => {
    registerDescription(true);
    return () => registerDescription(false);
  }, [registerDescription]);

  return (
    <p
      id={id ?? descriptionId}
      className={cn("text-body-small text-foreground-muted", className)}
      {...props}
    />
  );
}

export interface PopoverCloseProps extends ComponentPropsWithoutRef<"button"> {
  ref?: Ref<HTMLButtonElement>;
}

/** Dismisses the popover. Focus returns to the trigger. */
export function PopoverClose({ onClick, ...props }: PopoverCloseProps) {
  const { setOpen } = usePopover("PopoverClose");

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(false);
      }}
      {...props}
    />
  );
}
