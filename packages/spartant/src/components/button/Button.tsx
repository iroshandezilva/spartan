import type { ComponentPropsWithoutRef, MouseEvent } from "react";
import { cn } from "../../lib/cn.js";

/** Emphasis, described by meaning rather than colour. */
export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

/** Scale. `md` is the default and meets the touch floor on its own. */
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  /** Emphasis. Defaults to `primary`. */
  variant?: ButtonVariant;
  /** Scale. Defaults to `md`. */
  size?: ButtonSize;
  /**
   * Shows a progress indicator and refuses activation.
   *
   * Deliberately not the same as `disabled`. A disabled element loses focus and
   * disappears from the tab order, so a button that becomes disabled the moment
   * it is pressed drops the user's place in the page at the exact moment they
   * are waiting for something. This keeps the button focusable, marks it
   * `aria-disabled` and `aria-busy`, and swallows the activation instead.
   */
  loading?: boolean;
}

/**
 * Colour and emphasis per variant.
 *
 * A plain lookup of complete class strings, which is the convention in
 * `../API-CONVENTIONS.md`. Every value is a semantic role, so a theme change
 * retypes the button with no rebuild.
 */
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active",
  danger: "bg-danger text-danger-foreground hover:bg-danger-hover active:bg-danger-active",
  // Transparent rather than a colour token: the absence of a fill is not a
  // colour the theme needs an opinion about. The hover surface is a role.
  ghost: "bg-transparent text-foreground hover:bg-surface-muted active:bg-surface-selected",
};

/**
 * Height, padding, and type per size.
 *
 * Heights come from component tokens rather than the spacing scale, because
 * `md` carries the 44px accessibility floor and a spacing change must not be
 * able to shrink it. See `../../tokens/component/button.tokens.json`.
 */
const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-[var(--spartant-button-height-sm)] px-[var(--spartant-button-padding-x-sm)] text-body-small",
  md: "h-[var(--spartant-button-height-md)] px-[var(--spartant-button-padding-x-md)] text-body",
  lg: "h-[var(--spartant-button-height-lg)] px-[var(--spartant-button-padding-x-lg)] text-body-large",
};

/**
 * A centred hit area of at least 44px, on coarse pointers only.
 *
 * `sm` is 32px tall, which is right for a dense toolbar and wrong for a thumb.
 * Rather than inflate the design, the target is extended with a pseudo-element:
 * it is absolutely positioned so it never affects layout, centred so it grows
 * evenly, and `max()` means it is never smaller than the button itself.
 *
 * Gated on `pointer: coarse` deliberately. An invisible 44px target around a
 * 32px button in a mouse-driven toolbar would steal clicks from its neighbours.
 */
const hitArea = cn(
  "relative",
  "pointer-coarse:after:absolute pointer-coarse:after:left-1/2 pointer-coarse:after:top-1/2",
  "pointer-coarse:after:-translate-x-1/2 pointer-coarse:after:-translate-y-1/2",
  "pointer-coarse:after:content-['']",
  "pointer-coarse:after:h-[max(100%,var(--spartant-size-min-target))]",
  "pointer-coarse:after:w-[max(100%,var(--spartant-size-min-target))]",
);

const base = cn(
  "inline-flex items-center justify-center gap-control-gap",
  "rounded-control font-sans font-medium whitespace-nowrap",
  // One focus treatment, identical on every focusable component.
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  // Press feedback through the motion tokens. Named properties rather than
  // `all`. Under reduced motion the stylesheet collapses the duration to 0ms
  // and the scale to 1, so this stops moving without a branch here.
  "transition-[transform,background-color,color] duration-press ease-state",
  "not-disabled:active:scale-[var(--spartant-scale-press)]",
  // `disabled:` covers the native attribute; `aria-disabled` covers loading,
  // which keeps focus and so cannot use the attribute.
  "disabled:bg-surface-disabled disabled:text-foreground-disabled disabled:cursor-not-allowed",
  "aria-disabled:cursor-progress",
);

/**
 * The action control.
 *
 * A native `button`, so keyboard activation, form participation, and disabled
 * semantics come from the platform rather than from us.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        if (loading) {
          // Swallow the activation without disabling the element, so focus
          // stays where the user put it. Covers Enter and Space too, because
          // both dispatch a click on a native button.
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
      className={cn(base, hitArea, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {/*
       * The label stays in the DOM while loading, at zero opacity. It keeps the
       * accessible name, and it keeps the button's width, so a button that
       * starts loading does not resize and shove the layout around it.
       */}
      <span className={cn("inline-flex items-center gap-control-gap", loading && "opacity-0")}>
        {children}
      </span>
    </button>
  );
}

/**
 * The loading indicator, centred over the label.
 *
 * The rotation runs on `duration.indicator-loop`, which is a duration role, so
 * the global reduced-motion collapse sets it to `0ms` and the ring simply stops
 * turning. That is the intended behaviour rather than a side effect: rotation
 * is spatial and autoplaying, both of which the motion standard removes under
 * reduced motion, and `aria-busy` carries the state regardless.
 */
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute h-[1em] w-[1em] animate-spin rounded-pill",
        "border-2 border-current border-t-transparent",
        "[animation-duration:var(--spartant-duration-indicator-loop)]",
        // Constant speed, from the easing role meant for progress, rather than
        // whatever `animate-spin` defaults to.
        "ease-progress",
      )}
    />
  );
}
