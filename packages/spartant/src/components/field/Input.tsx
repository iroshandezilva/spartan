import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn.js";
import { controlStyles } from "./control-styles.js";
import { useField } from "./Field.js";

export interface InputProps extends ComponentPropsWithoutRef<"input"> {}

/**
 * A native `input`.
 *
 * `type` is forwarded untouched, so `email`, `number`, `date`, and the rest keep
 * their platform keyboards, pickers, and validation. Spartant styles the box and
 * stays out of the behaviour, which is the documented position: enhancing a
 * native type needs its own decision.
 *
 * Inside a `Field` the id, invalid state, description, disabled and required
 * flags are wired automatically. Standalone, pass them yourself.
 */
export function Input({ id, className, ...props }: InputProps) {
  const field = useField();

  return (
    <input
      id={id ?? field?.controlId}
      aria-invalid={props["aria-invalid"] ?? (field?.invalid || undefined)}
      aria-describedby={props["aria-describedby"] ?? (field?.describedBy || undefined)}
      required={props.required ?? field?.required}
      disabled={props.disabled ?? field?.disabled}
      className={cn(controlStyles, "h-[var(--spartant-field-height-md)]", className)}
      {...props}
    />
  );
}
