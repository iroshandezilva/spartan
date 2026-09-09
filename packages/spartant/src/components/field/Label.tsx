import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../../lib/cn.js";
import { useField } from "./Field.js";

export interface LabelProps extends ComponentPropsWithoutRef<"label"> {
  /**
   * Shows the required marker.
   *
   * Inherited from a surrounding `Field` when omitted, so the marker and the
   * control's `required` attribute cannot disagree.
   */
  required?: boolean;
}

/**
 * A native `label`.
 *
 * Native rather than `aria-labelledby` because a native label also makes the
 * label text a click target for its control, which is behaviour no ARIA
 * attribute gives back.
 */
export function Label({ required, htmlFor, id, className, children, ...props }: LabelProps) {
  const field = useField();
  const showRequired = required ?? field?.required ?? false;

  return (
    <label
      id={id ?? field?.labelId}
      htmlFor={htmlFor ?? field?.controlId}
      className={cn(
        "text-body-small font-medium text-foreground",
        field?.disabled && "text-foreground-disabled",
        className,
      )}
      {...props}
    >
      {children}
      {showRequired ? (
        <>
          {" "}
          <span className="text-danger-text" aria-hidden="true">
            *
          </span>
          {/*
           * The asterisk is decorative. Screen readers get the word, because a
           * lone "*" is announced as "star" or skipped entirely depending on
           * verbosity settings, and neither tells anyone the field is required.
           */}
          <span className="sr-only">(required)</span>
        </>
      ) : null}
    </label>
  );
}
