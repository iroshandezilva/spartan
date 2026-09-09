import type { ChangeEvent, ComponentPropsWithoutRef } from "react";
import { createContext, use, useId } from "react";
import { cn } from "../../lib/cn.js";
import { coarseHitArea, controlBase } from "./shared.js";

interface RadioGroupContextValue {
  name: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  onValueChange?: (value: string) => void;
}

/** Not exported. A `Radio` outside its group is a bug, and it says so. */
const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps extends Omit<ComponentPropsWithoutRef<"fieldset">, "onChange"> {
  /** Shared `name`, which is what makes the group mutually exclusive. Generated when omitted. */
  name?: string;
  /** Controlled selection. */
  value?: string;
  /** Uncontrolled initial selection. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onValueChange?: (value: string) => void;
  /** The visible group label. Rendered as a `legend`. */
  label?: string;
  invalid?: boolean;
}

/**
 * Mutually exclusive choices.
 *
 * A `fieldset` and `legend`, which is the native grouping. It gives the group
 * an accessible name that is announced when focus enters, with no ARIA at all.
 *
 * Arrow-key navigation, wrapping, and the roving tab stop are the browser's,
 * because the radios share a `name`. Reimplementing that is how a radio group
 * ends up subtly wrong on one platform.
 */
export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  label,
  invalid = false,
  disabled,
  className,
  children,
  ...props
}: RadioGroupProps) {
  const generated = useId();

  return (
    <RadioGroupContext
      value={{ name: name ?? generated, value, defaultValue, disabled, invalid, onValueChange }}
    >
      <fieldset disabled={disabled} className={cn("grid gap-2 border-0 p-0", className)} {...props}>
        {label ? (
          <legend className="mb-1 p-0 text-body-small font-medium text-foreground">{label}</legend>
        ) : null}
        {children}
      </fieldset>
    </RadioGroupContext>
  );
}

export interface RadioProps extends Omit<ComponentPropsWithoutRef<"input">, "type" | "name"> {
  /** The value this option contributes when selected. */
  value: string;
}

/** One option inside a {@link RadioGroup}. */
export function Radio({ value, className, onChange, ...props }: RadioProps) {
  const group = use(RadioGroupContext);
  if (!group) {
    throw new Error("Radio must be rendered inside a RadioGroup.");
  }

  const controlled = group.value !== undefined;

  return (
    <input
      type="radio"
      name={group.name}
      value={value}
      checked={controlled ? group.value === value : undefined}
      defaultChecked={controlled ? undefined : group.defaultValue === value}
      aria-invalid={props["aria-invalid"] ?? (group.invalid || undefined)}
      onChange={(event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
        if (event.currentTarget.checked) group.onValueChange?.(value);
      }}
      className={cn(
        controlBase,
        coarseHitArea,
        "size-[var(--spartant-selection-box)] rounded-pill",
        "checked:border-primary checked:bg-primary",
        "disabled:checked:border-border disabled:checked:bg-foreground-disabled",
        // The dot is an inset ring in the surface colour, so it needs no child
        // element and no extra box to keep aligned.
        "checked:shadow-[inset_0_0_0_4px_var(--spartant-color-surface)]",
        className,
      )}
      {...props}
    />
  );
}
