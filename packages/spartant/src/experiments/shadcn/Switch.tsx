import { type ComponentPropsWithoutRef, useId, useState } from "react";
import { cn } from "../../lib/cn.js";

/**
 * ADAPTED FROM shadcn/ui `switch`, new-york style.
 * Upstream snapshot and provenance: ./upstream/
 *
 * Experiment evidence for HAUX-65, not a released component. HAUX-48 owns the
 * real Switch. Deliberately not exported from the package entry point.
 *
 * The behaviour-heavy half of the experiment. What changed, and why:
 *
 * 1. `@radix-ui/react-switch` was dropped and the behaviour is owned. A switch
 *    is a button with `role="switch"` and `aria-checked`. The browser already
 *    gives Space, Enter, focus, and disabled handling to a native button, so
 *    the primitive was adding a dependency to re-supply what the platform
 *    provides. This is the dependency review reaching a conclusion, not a
 *    blanket rule: overlays that need focus trapping and dismissal are a
 *    different tier, and HAUX-50 and HAUX-52 make that call with evidence.
 * 2. The public API no longer leaks the primitive. Upstream typed its props as
 *    `ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>`, which makes
 *    Radix's entire surface part of the consumer contract and makes removing
 *    Radix a breaking change. AGENTS.md forbids exactly that.
 * 3. `"use client"` removed. It is a Next.js directive that means nothing to a
 *    library consumer on Vite, and shipping it is noise in every bundle.
 * 4. `forwardRef` removed and `ref` taken as a prop. React 19 does not need it,
 *    and `React.ElementRef` is deprecated in favour of `ComponentRef`.
 * 5. **The touch target was too small.** Upstream renders 20x36 CSS pixels.
 *    The motion and accessibility standard requires 44x44. The control keeps
 *    its visual size and gains a transparent hit area that meets the floor.
 *    This is the kind of thing that survives a copy-paste unnoticed.
 * 6. `data-[state=checked]` became ordinary conditional classes, since without
 *    Radix nothing sets those attributes.
 * 7. `bg-input` is not a Spartant role. The unchecked track uses
 *    `surface-muted` with a border, which is a real role with a contrast pairing.
 * 8. `disabled:opacity-50` became the disabled tokens. Opacity produces a
 *    different result on every surface and cannot be contrast-checked.
 * 9. Motion uses the duration and easing tokens, so it collapses under reduced
 *    motion with no work here.
 */

export interface SwitchProps
  extends Omit<ComponentPropsWithoutRef<"button">, "onChange" | "type" | "value"> {
  /** Controlled state. Omit for uncontrolled. */
  checked?: boolean;
  /** Initial state when uncontrolled. */
  defaultChecked?: boolean;
  /** Called with the next state. */
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible name, when no visible label is associated. */
  "aria-label"?: string;
}

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled,
  className,
  id,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const [uncontrolled, setUncontrolled] = useState(defaultChecked);
  // Controlled when `checked` is supplied, uncontrolled otherwise. The mode is
  // fixed by the first render, as it is for a native input.
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : uncontrolled;

  return (
    <button
      type="button"
      role="switch"
      id={id ?? generatedId}
      aria-checked={isOn}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        if (!isControlled) setUncontrolled(!isOn);
        onCheckedChange?.(!isOn);
      }}
      className={cn(
        // The 44px floor is met by the hit area, not the visual, so the control
        // stays small while remaining reachable on touch.
        "relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
        "disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none flex h-5 w-9 items-center rounded-pill border transition-colors ease-state",
          isOn ? "border-transparent bg-primary" : "border-border bg-surface-muted",
          disabled && "border-transparent bg-surface-disabled",
        )}
        style={{ transitionDuration: "var(--spartant-duration-state-change)" }}
      >
        <span
          className={cn(
            "block size-4 rounded-pill bg-surface shadow-surface transition-transform ease-state",
            isOn ? "translate-x-4" : "translate-x-0.5",
            disabled && "bg-foreground-disabled",
          )}
          style={{ transitionDuration: "var(--spartant-duration-state-change)" }}
        />
      </span>
    </button>
  );
}
