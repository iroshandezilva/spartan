import type { ComponentPropsWithoutRef, ReactNode, RefObject } from "react";
import { createContext, use, useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "../../lib/cn.js";

interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
  descriptionId: string;
  hasDescription: boolean;
  registerDescription: (present: boolean) => void;
  dialogRef: RefObject<HTMLDialogElement | null>;
}

/** Not exported. A part outside its `Dialog` throws with a message naming both. */
const DialogContext = createContext<DialogContextValue | null>(null);

function useDialog(part: string): DialogContextValue {
  const context = use(DialogContext);
  if (!context) {
    throw new Error(`${part} must be rendered inside a Dialog.`);
  }
  return context;
}

export interface DialogProps {
  /** Controlled open state. */
  open?: boolean;
  /** Uncontrolled initial state. Defaults to closed. */
  defaultOpen?: boolean;
  /** Called with the new open state, from any dismissal path. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

/**
 * A modal task.
 *
 * Built on the native `dialog` element with `showModal()`, which is the
 * approved decision from HAUX-44. That single call gives a focus trap, top
 * layer stacking above every `z-index`, `Escape` dismissal, inertness of
 * everything behind it, and focus restoration to the element that opened it.
 * Reimplementing those is where hand-built dialogs go wrong, and the platform
 * has them right.
 *
 * What Spartant owns is the part the platform leaves open: the backdrop and
 * surface styling from tokens, their coordinated timing, and making sure the
 * exit animation never delays focus coming back.
 */
export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const generated = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const [hasDescription, setHasDescription] = useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolled;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return (
    <DialogContext
      value={{
        open: isOpen,
        setOpen,
        titleId: `${generated}-title`,
        descriptionId: `${generated}-description`,
        hasDescription,
        registerDescription: setHasDescription,
        dialogRef,
      }}
    >
      {children}
    </DialogContext>
  );
}

export interface DialogTriggerProps extends ComponentPropsWithoutRef<"button"> {}

/** Opens the dialog. Any button works; this one just wires the state. */
export function DialogTrigger({ onClick, ...props }: DialogTriggerProps) {
  const { setOpen } = useDialog("DialogTrigger");

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(true);
      }}
      {...props}
    />
  );
}

export interface DialogContentProps extends ComponentPropsWithoutRef<"dialog"> {
  /**
   * Whether clicking the backdrop dismisses.
   *
   * Defaults to true. Turn it off for a dialog holding unsaved work, where a
   * stray click should not discard it.
   */
  dismissOnOutsideClick?: boolean;
}

/**
 * The modal surface.
 *
 * Rendered where it sits in the tree, not in a portal. `showModal()` promotes
 * the element to the top layer, so it paints above everything regardless of
 * where it lives or what `overflow` or `z-index` its ancestors have. A portal
 * would be solving a problem the top layer already solved.
 */
export function DialogContent({
  dismissOnOutsideClick = true,
  className,
  children,
  onClose,
  onCancel,
  onClick,
  ...props
}: DialogContentProps) {
  const { open, setOpen, titleId, descriptionId, hasDescription, dialogRef } =
    useDialog("DialogContent");

  useEffect(() => {
    const node = dialogRef.current;
    if (!node) return;

    if (open && !node.open) {
      node.showModal();
    } else if (!open && node.open) {
      /*
       * `close()` immediately, without waiting for an exit animation.
       *
       * The motion standard is explicit that focus must never wait for motion,
       * and `close()` is what returns focus to the trigger. Holding it back to
       * let a transition finish would mean a keyboard user is stranded for the
       * length of the animation with focus nowhere useful. The surface can
       * animate out only if it does so without gating this call, which is why
       * the exit here is instant and honest rather than pretty.
       */
      node.close();
    }
  }, [open, dialogRef]);

  useEffect(() => {
    /*
     * Lock page scroll while modal.
     *
     * `showModal()` makes the page inert, but inert does not make the viewport
     * unscrollable. Measured in Chrome during the HAUX-69 audit: with a modal
     * dialog open, the root's computed `overflow` was still `visible` and
     * nothing else held the page, so a wheel or trackpad over the backdrop
     * could scroll the document behind the dialog. That was the one behaviour
     * shadcn's Radix-based Dialog had that this one did not. The native
     * element leaves the lock to the author, so it lives here: `overflow:
     * hidden` on the root while open, with the width of the scrollbar that
     * disappears added back as padding so the page does not shift sideways.
     * Both are restored to exactly what they were on close or unmount, so a
     * consumer's own inline styles survive.
     */
    if (!open) return;
    const root = document.documentElement;
    const previous = { overflow: root.style.overflow, paddingRight: root.style.paddingRight };
    const gutter = window.innerWidth - root.clientWidth;
    root.style.overflow = "hidden";
    if (gutter > 0) root.style.paddingRight = `${gutter}px`;
    return () => {
      root.style.overflow = previous.overflow;
      root.style.paddingRight = previous.paddingRight;
    };
  }, [open]);

  return (
    /*
     * biome-ignore lint/a11y/useKeyWithClickEvents: the rule guards against a
     * click-only interactive `div`. This is a native `dialog`, and its keyboard
     * dismissal is `Escape`, which the platform handles and reports through the
     * `close` event that this component already syncs from. The `onClick` here
     * does one thing: detect that a click landed on the backdrop rather than on
     * the surface. A keyboard equivalent of "clicked outside" does not exist,
     * and adding a key handler to satisfy the rule would be dead code.
     */
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={hasDescription ? descriptionId : undefined}
      /*
       * `close` fires for every dismissal path the platform owns: Escape, the
       * close button, and `close()` itself. Syncing state here rather than in
       * each handler means no path can get out without the state following.
       */
      onClose={(event) => {
        onClose?.(event);
        setOpen(false);
      }}
      onCancel={(event) => {
        onCancel?.(event);
      }}
      onClick={(event) => {
        onClick?.(event);
        if (!dismissOnOutsideClick || event.defaultPrevented) return;
        /*
         * The backdrop is part of the dialog element, so a click on it targets
         * the dialog itself rather than any child. Comparing the target to the
         * element is the whole test, and it is why the padding lives on an
         * inner wrapper: padding here would make the dialog's own box larger
         * than the visible surface and dismiss on a click just outside it.
         */
        if (event.target === dialogRef.current) setOpen(false);
      }}
      className={cn(
        "m-auto w-[calc(100vw-2rem)] max-w-[var(--spartant-dialog-max-width)] p-0",
        "rounded-surface border border-border bg-surface text-foreground shadow-modal",
        "backdrop:bg-[var(--spartant-dialog-backdrop)]",
        // Entry only. Both the surface and the backdrop run the same duration
        // and easing so neither lands before the other.
        "starting:open:opacity-0 starting:open:scale-[var(--spartant-scale-overlay-enter)]",
        "open:opacity-100 open:scale-100",
        "transition-[opacity,scale,display,overlay] duration-modal-enter ease-enter",
        "transition-discrete",
        "backdrop:starting:open:opacity-0 backdrop:open:opacity-100",
        "backdrop:transition-[opacity,display,overlay] backdrop:duration-modal-enter backdrop:ease-enter",
        "backdrop:transition-discrete",
        className,
      )}
      {...props}
    >
      <div className="grid gap-stack p-surface">{children}</div>
    </dialog>
  );
}

export interface DialogTitleProps extends ComponentPropsWithoutRef<"h2"> {}

/**
 * The accessible name.
 *
 * Required. A modal without a name is announced as "dialog" and nothing else,
 * which tells a screen-reader user that something has taken over the page and
 * not what it is.
 */
export function DialogTitle({ id, className, ...props }: DialogTitleProps) {
  const { titleId } = useDialog("DialogTitle");
  return (
    <h2
      id={id ?? titleId}
      className={cn("text-heading font-semibold tracking-heading text-foreground", className)}
      {...props}
    />
  );
}

export interface DialogDescriptionProps extends ComponentPropsWithoutRef<"p"> {}

/** Optional supporting text, announced after the name. */
export function DialogDescription({ id, className, ...props }: DialogDescriptionProps) {
  const { descriptionId, registerDescription } = useDialog("DialogDescription");

  useEffect(() => {
    registerDescription(true);
    return () => registerDescription(false);
  }, [registerDescription]);

  return (
    <p
      id={id ?? descriptionId}
      className={cn("text-body text-foreground-muted", className)}
      {...props}
    />
  );
}

export interface DialogCloseProps extends ComponentPropsWithoutRef<"button"> {}

/** Dismisses the dialog. Focus returns to the trigger, because `close()` does that. */
export function DialogClose({ onClick, ...props }: DialogCloseProps) {
  const { setOpen } = useDialog("DialogClose");

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
