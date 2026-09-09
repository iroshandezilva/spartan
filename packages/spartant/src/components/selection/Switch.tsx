import type { ChangeEvent, ComponentPropsWithoutRef, Ref } from "react";
import { cn } from "../../lib/cn.js";
import { useField } from "../field/Field.js";
import { coarseHitArea } from "./shared.js";

export interface SwitchProps extends Omit<ComponentPropsWithoutRef<"input">, "type" | "role"> {
  /** Called with the new checked state. The native `onChange` still fires. */
  onCheckedChange?: (checked: boolean) => void;
  ref?: Ref<HTMLInputElement>;
}

/**
 * An immediate binary setting.
 *
 * A native checkbox carrying `role="switch"`, which maps its checked state onto
 * `aria-checked` while keeping form participation and label activation. A
 * `button` with `aria-checked` would give up both.
 *
 * The distinction from Checkbox is behavioural, not visual: a switch takes
 * effect on flip, a checkbox is a value you submit. Use the one that matches
 * what happens, not the one that looks right.
 */
export function Switch({ onCheckedChange, onChange, className, ref, ...props }: SwitchProps) {
  const field = useField();

  return (
    <input
      type="checkbox"
      ref={ref}
      /*
       * biome-ignore lint/a11y/useAriaPropsForRole: the rule wants an explicit
       * `aria-checked`, which would be wrong here. `role="switch"` on a native
       * checkbox is explicitly permitted by ARIA in HTML, and the element's
       * `checked` state maps onto `aria-checked` automatically. Writing the
       * attribute by hand would mean maintaining a second source of truth that
       * cannot be correct in the uncontrolled case, where the component does
       * not know the value at render time. A stale `aria-checked` overrides the
       * real one, so the fix the rule asks for is the bug. `PointerPath`
       * asserts the resulting semantics through the accessibility tree.
       */
      role="switch"
      id={props.id ?? field?.controlId}
      aria-invalid={props["aria-invalid"] ?? (field?.invalid || undefined)}
      aria-describedby={props["aria-describedby"] ?? (field?.describedBy || undefined)}
      disabled={props.disabled ?? field?.disabled}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        onCheckedChange?.(event.currentTarget.checked);
      }}
      className={cn(
        "shrink-0 appearance-none rounded-pill border border-transparent bg-border-strong",
        "w-[var(--spartant-selection-switch-width)] h-[var(--spartant-selection-switch-height)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "checked:bg-primary",
        "disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:border-border",
        /*
         * Disabled and checked collide: both set the track colour at the same
         * specificity, so the later rule wins and a disabled-on switch painted
         * a near-invisible thumb on a pale track, measured at 1.16:1. Checkbox
         * solved this and Switch never inherited the fix, because the two share
         * no code. Same treatment here.
         */
        "disabled:checked:bg-foreground-disabled",
        "aria-invalid:border-danger",
        coarseHitArea,
        /*
         * The thumb is a background image positioned from the left, so the
         * movement is a background-position transition. That keeps it off the
         * layout entirely: nothing around the switch can move, whatever the
         * timing does.
         */
        "bg-no-repeat bg-[length:var(--spartant-selection-switch-thumb)_var(--spartant-selection-switch-thumb)]",
        "bg-[position:3px_center] checked:bg-[position:calc(100%-3px)_center]",
        /*
         * The thumb takes the surface role, not a literal white.
         *
         * White measured 2.33:1 against the checked track in dark theme, under
         * a 3:1 floor for an indicator that carries state, and no gate could
         * see it: a colour written inside an arbitrary value is invisible to
         * `check:colors`, which only validates declared pairings between roles.
         * `color.surface` inverts with the theme and clears 3:1 in every
         * combination, checked and unchecked, light and dark, including the
         * disabled fill above.
         */
        "bg-[image:radial-gradient(circle,var(--spartant-color-surface)_49%,transparent_50%)]",
        // Track colour and thumb position, on the move easing because the thumb
        // travels between two visible positions.
        "transition-[background-color,background-position,border-color] duration-state ease-move",
        className,
      )}
      {...props}
    />
  );
}
