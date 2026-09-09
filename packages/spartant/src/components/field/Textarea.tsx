import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn.js";
import { controlStyles } from "./control-styles.js";
import { useField } from "./Field.js";

export interface TextareaProps extends ComponentPropsWithoutRef<"textarea"> {}

/**
 * A native `textarea`.
 *
 * Resizes vertically only. Free horizontal resizing lets a user drag a control
 * out of its column and break the layout around it, and there is no reason to
 * want it.
 */
export function Textarea({ id, className, ...props }: TextareaProps) {
  const field = useField();

  return (
    <textarea
      id={id ?? field?.controlId}
      aria-invalid={props["aria-invalid"] ?? (field?.invalid || undefined)}
      aria-describedby={props["aria-describedby"] ?? (field?.describedBy || undefined)}
      required={props.required ?? field?.required}
      disabled={props.disabled ?? field?.disabled}
      className={cn(
        controlStyles,
        "min-h-[var(--spartant-field-textarea-min-height)] resize-y",
        // Vertical padding is the control padding role rather than a raw
        // spacing step. The HAUX-69 audit swapped a raw utility of the same
        // 0.5rem for it, so the rendered box did not change; what changed is
        // that the value now follows the token if the token moves.
        "py-control-y",
        className,
      )}
      {...props}
    />
  );
}
