import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { createContext, use, useCallback, useId, useMemo, useState } from "react";
import { cn } from "../../lib/cn.js";

/** Which message slot a {@link FieldMessage} occupies. */
export type FieldMessageTone = "description" | "error";

interface FieldContextValue {
  controlId: string;
  labelId: string;
  invalid: boolean;
  required: boolean;
  disabled: boolean;
  /** Ids of the messages currently rendered, in reading order. */
  describedBy: string;
  messageId: (tone: FieldMessageTone) => string;
  register: (tone: FieldMessageTone, present: boolean) => void;
}

/**
 * Not exported. A part reaching for this from outside its `Field` is a bug we
 * want to fail loudly rather than a public extension point.
 */
const FieldContext = createContext<FieldContextValue | null>(null);

/**
 * Reads the surrounding field, or nothing.
 *
 * Every part works standalone, so this returns `null` rather than throwing. A
 * bare `Input` on a page is a legitimate thing to render; it simply has to be
 * given its own `id` and label.
 */
function useField(): FieldContextValue | null {
  return use(FieldContext);
}

export interface FieldProps extends Omit<ComponentPropsWithoutRef<"div">, "id"> {
  /**
   * Id for the control. Generated when omitted.
   *
   * Worth passing when something outside the field has to point at the control,
   * such as an external error summary that links to the first invalid input.
   */
  id?: string;
  /** Marks the control invalid and shows the error message slot. */
  invalid?: boolean;
  /** Marks the control required, on the control and in the label. */
  required?: boolean;
  /** Disables the control and dims the label. */
  disabled?: boolean;
  children?: ReactNode;
}

/**
 * Wires a label, a control, and its messages together.
 *
 * The association is the whole point. A label that does not target its input,
 * or an error that no `aria-describedby` reaches, is not a partially working
 * field; it is a field that lies to assistive technology while looking correct.
 *
 * Ids come from `useId`, so two fields on one page cannot collide, which is the
 * classic form bug. Pass `id` to override.
 */
export function Field({
  id,
  invalid = false,
  required = false,
  disabled = false,
  className,
  children,
  ...props
}: FieldProps) {
  const generated = useId();
  const controlId = id ?? `${generated}-control`;

  /*
   * Messages register themselves so `aria-describedby` only ever names ids that
   * exist. Pointing at a missing id is not harmless: a screen reader announces
   * nothing where the author believed it announced the error, and the markup
   * looks deliberate either way.
   *
   * Measured, not assumed: the axe audit does **not** catch this. Injecting a
   * dangling reference left every accessibility check green, and only the
   * explicit `NoDanglingDescribedBy` story failed. That is why the story
   * exists rather than trusting the audit to notice.
   */
  const [present, setPresent] = useState<Record<FieldMessageTone, boolean>>({
    description: false,
    error: false,
  });

  const messageId = useCallback((tone: FieldMessageTone) => `${controlId}-${tone}`, [controlId]);

  const register = useCallback((tone: FieldMessageTone, mounted: boolean) => {
    setPresent((current) =>
      current[tone] === mounted ? current : { ...current, [tone]: mounted },
    );
  }, []);

  const value = useMemo<FieldContextValue>(() => {
    // Description first, then error: the order they are announced in.
    const ids = [
      present.description ? messageId("description") : null,
      present.error ? messageId("error") : null,
    ].filter((entry): entry is string => entry !== null);

    return {
      controlId,
      labelId: `${controlId}-label`,
      invalid,
      required,
      disabled,
      describedBy: ids.join(" "),
      messageId,
      register,
    };
  }, [controlId, invalid, required, disabled, present, messageId, register]);

  return (
    <FieldContext value={value}>
      <div className={cn("grid gap-1.5", className)} {...props}>
        {children}
      </div>
    </FieldContext>
  );
}

export { type FieldContextValue, useField };
