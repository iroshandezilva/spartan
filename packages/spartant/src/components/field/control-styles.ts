import { cn } from "../../lib/cn.js";

/**
 * Everything an `Input` and a `Textarea` share.
 *
 * One string rather than two, because the moment they drift a form contains two
 * controls that are almost the same shade of almost the same grey, and nobody
 * can say which is correct.
 */
export const controlStyles = cn(
  "w-full rounded-control border border-border bg-surface font-sans text-body text-foreground",
  "px-[var(--spartant-field-padding-x)]",
  "placeholder:text-foreground-muted",
  /*
   * Colour only, and deliberately not the outline.
   *
   * A field must not move while it is being typed into, so focus and validation
   * change the border and background and nothing else. `outline-color` used to
   * be in this list, which meant the focus ring appeared instantly but spent
   * 160ms settling from the inherited text colour to the focus-ring colour.
   * Button and the selection controls never transitioned it, so a text field
   * was the one place a focus ring arrived in the wrong colour. HAUX-68 found
   * the inconsistency by comparing the three lists and removed it: focus
   * feedback is now instant and correct everywhere.
   */
  "transition-[border-color,background-color] duration-state ease-state",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
  // The border carries the invalid state as well as the message, because
  // colour alone is not an accessible signal and neither is text alone.
  "aria-invalid:border-danger",
  "disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-foreground-disabled",
  "disabled:placeholder:text-foreground-disabled",
  // Read-only is not disabled: the value is still selectable and copyable, and
  // the control still takes focus. It only looks quieter.
  "read-only:bg-surface-muted",
);
