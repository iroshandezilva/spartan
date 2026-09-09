import type { ComponentPropsWithoutRef } from "react";
import { useEffect } from "react";
import { cn } from "../../lib/cn.js";
import { type FieldMessageTone, useField } from "./Field.js";

export interface FieldMessageProps extends ComponentPropsWithoutRef<"p"> {
  /**
   * What this message is.
   *
   * `description` is standing help text. `error` is a validation failure, and
   * it is announced when it appears.
   */
  tone?: FieldMessageTone;
}

/**
 * Help text or a validation error, associated with the control.
 *
 * Registers itself with the surrounding `Field` so the control's
 * `aria-describedby` names it. Without that registration the control would
 * either point at an id that does not exist, or not point at the message at
 * all, and both look identical on screen.
 */
export function FieldMessage({
  tone = "description",
  id,
  className,
  children,
  ...props
}: FieldMessageProps) {
  const field = useField();
  const register = field?.register;

  useEffect(() => {
    if (!register) return;
    register(tone, true);
    return () => register(tone, false);
  }, [register, tone]);

  return (
    <p
      id={id ?? field?.messageId(tone)}
      /*
       * An error appears after the user has already moved on, so it has to
       * announce itself. `polite` rather than `assertive`: an interruption
       * mid-word is worse than a short wait, and validation is not an emergency.
       * A description is static text and needs no live region at all.
       */
      aria-live={tone === "error" ? "polite" : undefined}
      className={cn(
        "text-caption",
        tone === "error" ? "text-danger-text" : "text-foreground-muted",
        field?.disabled && tone === "description" && "text-foreground-disabled",
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
