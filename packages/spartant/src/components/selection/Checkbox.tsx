import type { ChangeEvent, ComponentPropsWithoutRef, Ref } from "react";
import { useEffect, useRef } from "react";
import { cn } from "../../lib/cn.js";
import { useField } from "../field/Field.js";
import { coarseHitArea, controlBase } from "./shared.js";

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<"input">, "type"> {
  /**
   * Neither checked nor unchecked.
   *
   * A DOM property rather than an attribute, so it has to be set through a ref.
   * There is no `indeterminate` attribute in HTML, which is why writing
   * `<input indeterminate>` silently does nothing.
   */
  indeterminate?: boolean;
  /** Called with the new checked state. The native `onChange` still fires. */
  onCheckedChange?: (checked: boolean) => void;
  ref?: Ref<HTMLInputElement>;
}

/**
 * The tick and the dash.
 *
 * Sibling elements rather than a `background-image`, which was the first
 * attempt and failed twice over. A Tailwind arbitrary value cannot contain
 * spaces, so an inline SVG data URI tears the class apart at the first space
 * in `<svg xmlns=...`; and a `bg-` utility wrapping a url function is
 * ambiguous enough that `tailwind-merge` reads it as a background colour and
 * drops the fill beside it. The result rendered as a white box with no mark,
 * which looks like a missing style rather than two escaping problems.
 *
 * That utility is deliberately described here rather than written out.
 * Tailwind scans comments too, so spelling it produced a real rule containing
 * an unresolvable `url(...)`: Vite tolerated it and shipped it, Turbopack
 * refused to build `apps/docs` at all.
 *
 * As siblings the marks cost one wrapper, take their colour from a token
 * instead of a hardcoded white, and have nothing to escape.
 */
function Mark({ variant }: { variant: "check" | "dash" }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground opacity-0",
        variant === "check"
          ? "peer-checked:opacity-100 peer-indeterminate:opacity-0"
          : "peer-indeterminate:opacity-100",
        // Opacity only, on the state duration. Nothing here can move layout.
        "transition-opacity duration-state ease-state",
      )}
    >
      {/*
       * No <title>. The svg is aria-hidden because the input already reports
       * checked, unchecked, and mixed; a title here would be dead text in the
       * DOM that only confuses a query by text.
       */}
      <path
        d={variant === "check" ? "M3.5 8.5l3 3 6-6" : "M4 8h8"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * An independent choice.
 *
 * A native `input type="checkbox"` with `appearance-none`, not a `div` wearing
 * `role="checkbox"`. It keeps form participation, label activation, the
 * indeterminate property, and the platform's own keyboard handling, and only
 * the painting is ours.
 *
 * `className` and `ref` both target the `input`. The wrapper exists solely to
 * position the mark over it and carries nothing a caller would want to style.
 */
export function Checkbox({
  indeterminate = false,
  onCheckedChange,
  onChange,
  className,
  ref,
  ...props
}: CheckboxProps) {
  const field = useField();
  const inner = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inner.current) inner.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <span className="relative inline-flex shrink-0">
      <input
        type="checkbox"
        ref={(node) => {
          inner.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        id={props.id ?? field?.controlId}
        aria-invalid={props["aria-invalid"] ?? (field?.invalid || undefined)}
        aria-describedby={props["aria-describedby"] ?? (field?.describedBy || undefined)}
        disabled={props.disabled ?? field?.disabled}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange?.(event);
          onCheckedChange?.(event.currentTarget.checked);
        }}
        className={cn(
          controlBase,
          coarseHitArea,
          "peer size-[var(--spartant-selection-box)]",
          "rounded-[max(2px,calc(var(--spartant-radius-control)/2))]",
          "checked:border-primary checked:bg-primary",
          "indeterminate:border-primary indeterminate:bg-primary",
          "disabled:checked:border-border disabled:checked:bg-foreground-disabled",
          "disabled:indeterminate:border-border disabled:indeterminate:bg-foreground-disabled",
          className,
        )}
        {...props}
      />
      <Mark variant="check" />
      <Mark variant="dash" />
    </span>
  );
}
