import type { ChangeEvent, ComponentPropsWithoutRef, Ref } from "react";
import { cn } from "../../lib/cn.js";
import { controlStyles } from "../field/control-styles.js";
import { useField } from "../field/Field.js";

export interface SelectProps extends Omit<ComponentPropsWithoutRef<"select">, "multiple" | "size"> {
  /**
   * Shown while nothing has been chosen.
   *
   * A native `select` has no placeholder attribute, so this renders as the
   * first option with an empty value. It is the accessible value as well as the
   * visible one, which is the honest thing for a screen reader to report: the
   * field's value really is "Choose a country" until the user chooses one.
   *
   * When the control is required the option is disabled, so it cannot be
   * chosen deliberately and the empty value fails native validation. When it is
   * optional the option stays selectable, so the user can return to no choice.
   */
  placeholder?: string;
  /** Called with the new value. The native `onChange` still fires. */
  onValueChange?: (value: string) => void;
  ref?: Ref<HTMLSelectElement>;
}

/**
 * What a select has that a text input does not.
 *
 * `appearance-none` removes the platform's own arrow so the chevron can be
 * drawn from a token, and the right padding leaves room for it. The list the
 * user picks from is still the platform's popup: `appearance-none` restyles
 * the closed control only, which is exactly the split HAUX-52 decided on.
 *
 * Options are given the surface and foreground roles explicitly. Chrome on
 * Windows and Linux paints its own popup and inherits `color` from the
 * control, so without this a muted placeholder colour would wash over every
 * option in the list. macOS and iOS ignore option styling entirely, which is
 * fine, because their pickers are always legible.
 */
const selectStyles = cn(
  "peer appearance-none h-[var(--spartant-field-height-md)]",
  // `:read-only` matches every element that is not `:read-write`, and a select
  // never is, so the shared read-only tint would paint every select as muted.
  // Measured in Chrome before this line existed: the surface read 0.95 L
  // instead of the surface role. Disabled still wins; it is declared later in
  // the stylesheet's variant order and asserted by the story lane's rendering.
  "read-only:bg-surface disabled:bg-surface-disabled",
  "pr-[calc(var(--spartant-field-padding-x)*2+1rem)]",
  // A long label is clipped with an ellipsis rather than growing the control
  // or spilling under the chevron.
  "truncate",
  // The chevron is the affordance; the border strengthening on hover is the
  // pointer's confirmation that the box is a control. Colour only, and
  // Tailwind wraps `hover:` in `@media (hover: hover)` so touch never sees it.
  // Invalid keeps its border: a hover must never hide a validation state.
  "hover:not-disabled:not-aria-invalid:border-border-strong",
  // While the placeholder option is the selection, the control reads as empty
  // the same way an empty input does. `:checked` matches a selected option.
  "has-[option[value='']:checked]:text-foreground-muted",
  "disabled:has-[option[value='']:checked]:text-foreground-disabled",
  "[&_option]:bg-surface [&_option]:text-foreground",
  "[&_option:disabled]:text-foreground-disabled",
);

/**
 * One choice from a list, on the native `select`.
 *
 * Native rather than a custom listbox, decided in HAUX-52 with the reasoning
 * in `README.md`. The short version: the platform supplies keyboard
 * navigation, typeahead, form participation, the mobile picker, `Escape`, and
 * focus return, and no dependency was needed to keep any of it. What it costs
 * is the popup's appearance, which is recorded as a limitation rather than
 * bought back with a primitive library.
 *
 * Children are native `option` and `optgroup` elements, so composition stays
 * native too. Inside a `Field` the id, invalid state, description, disabled
 * and required flags are wired automatically, exactly as they are for `Input`.
 * Standalone, pass them yourself.
 *
 * `className` and `ref` both target the `select`. The wrapper exists solely to
 * position the chevron over it and carries nothing a caller would want to
 * style.
 */
export function Select({
  placeholder,
  onValueChange,
  onChange,
  className,
  ref,
  children,
  ...props
}: SelectProps) {
  const field = useField();
  const required = props.required ?? field?.required;
  const disabled = props.disabled ?? field?.disabled;

  /*
   * The placeholder has to start selected, and asking for that is not enough
   * on its own. The HTML selectedness algorithm skips a disabled first option
   * and selects the first enabled one instead, so a required select with a
   * placeholder would open showing its first real option as though the user
   * had chosen it. Supplying an empty default value pins the placeholder,
   * and only when the caller has not set a value of their own.
   */
  const defaultValue =
    placeholder !== undefined && props.value === undefined && props.defaultValue === undefined
      ? ""
      : undefined;

  return (
    <span className="relative grid w-full">
      <select
        ref={ref}
        id={props.id ?? field?.controlId}
        aria-invalid={props["aria-invalid"] ?? (field?.invalid || undefined)}
        aria-describedby={props["aria-describedby"] ?? (field?.describedBy || undefined)}
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
          onChange?.(event);
          onValueChange?.(event.currentTarget.value);
        }}
        className={cn(controlStyles, selectStyles, className)}
        {...props}
      >
        {placeholder !== undefined ? (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <Chevron />
    </span>
  );
}

/**
 * The open affordance, drawn from a token rather than left to the platform.
 *
 * Decorative: the `select` already reports its role, and a screen reader
 * announces "pop-up button" or "combo box" without help. `pointer-events-none`
 * so a press on the chevron reaches the control underneath. It does not
 * rotate when the list opens, because a native select exposes no open state
 * that every browser agrees on, and an affordance that animates in one
 * browser and not another is worse than one that stays still.
 */
function Chevron() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 right-[var(--spartant-field-padding-x)] my-auto size-4",
        "text-foreground-muted peer-disabled:text-foreground-disabled",
      )}
    >
      <path
        d="M4 6l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
