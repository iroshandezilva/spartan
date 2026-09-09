"use client";

import { Button, Field, FieldMessage, Label, Select } from "@iroshandezilva/spartant";
import { useState } from "react";

const countries = [
  { value: "gb", label: "United Kingdom" },
  { value: "lk", label: "Sri Lanka" },
  { value: "nz", label: "New Zealand" },
  { value: "jp", label: "Japan" },
] as const;

/**
 * One controlled Select inside a Field, with a readout and a reset.
 *
 * The readout flips in `onValueChange`, which the component calls from the
 * native change event, so it is correct the moment a choice lands and never
 * waits for the border transition. The reset proves the value can be set from
 * outside: the control follows its parent back to the placeholder.
 *
 * The list the reader opens is the platform's popup, not a Spartant surface,
 * so it looks the same in both motion modes. What differs between the two
 * copies is the border colour on hover and on becoming invalid: a transition
 * on the left, instant on the right.
 */
export function SelectDemoClient() {
  const [value, setValue] = useState("");
  const chosen = countries.find((country) => country.value === value);

  return (
    <div className="grid gap-3">
      <Field required invalid={value === ""}>
        <Label>Country</Label>
        <Select placeholder="Choose a country" value={value} onValueChange={setValue}>
          {countries.map((country) => (
            <option key={country.value} value={country.value}>
              {country.label}
            </option>
          ))}
        </Select>
        <FieldMessage>Where the invoice is addressed.</FieldMessage>
        {value === "" ? (
          <FieldMessage tone="error">Required. The border carries the state too.</FieldMessage>
        ) : null}
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setValue("")}>
          Reset
        </Button>
        <span className="text-caption text-foreground-muted" aria-live="polite">
          {chosen ? `Value: ${chosen.value} (${chosen.label})` : "Value: empty, placeholder shown"}
        </span>
      </div>
    </div>
  );
}
