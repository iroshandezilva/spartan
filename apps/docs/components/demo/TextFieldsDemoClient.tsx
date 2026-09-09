"use client";

import { Field, FieldMessage, Input, Label, Textarea } from "@iroshandezilva/spartant";
import { useState } from "react";

/** The narrowest check that still produces a real invalid state while typing. */
function looksLikeAnAddress(value: string): boolean {
  const at = value.indexOf("@");
  return at > 0 && at < value.length - 1;
}

/**
 * One field that becomes invalid as the reader types, and one textarea for
 * scale.
 *
 * `invalid` is derived from the value in the change handler, so the border
 * colour, `aria-invalid`, and the error message all flip on the keystroke.
 * The border colour is the only thing that transitions; the message and the
 * attribute are immediate, which is why the right-hand copy differs only in
 * how the border arrives. The readout below the field is deliberately not a
 * live region: the error message already is one, and announcing the same
 * change twice would be noise.
 */
export function TextFieldsDemoClient() {
  const [email, setEmail] = useState("");
  const touched = email.length > 0;
  const invalid = touched && !looksLikeAnAddress(email);

  return (
    <div className="grid gap-3">
      <Field invalid={invalid} required>
        <Label>Email address</Label>
        <Input
          type="email"
          placeholder="you@example.com"
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <FieldMessage>We only use this to send receipts.</FieldMessage>
        {invalid ? (
          <FieldMessage tone="error">Enter an address in the form name@example.com.</FieldMessage>
        ) : null}
      </Field>
      <span className="text-caption text-foreground-muted">
        {invalid
          ? "The control reports aria-invalid and the error is in aria-describedby."
          : touched
            ? "The control reports valid and aria-describedby names only the description."
            : "Type a value without an @ to see the invalid state arrive."}
      </span>
      <Field>
        <Label>Note</Label>
        <Textarea placeholder="Optional. Resizes vertically only." />
      </Field>
    </div>
  );
}
