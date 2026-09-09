"use client";

import { Checkbox, Label, Radio, RadioGroup, Switch } from "@iroshandezilva/spartant";
import { useId, useState } from "react";

const periods = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly, two months free" },
] as const;

const rows = ["Invoices", "Receipts"] as const;

/**
 * All three controls, each with a readout that flips in the change handler.
 *
 * Every control is controlled here so the readout and the control cannot
 * disagree, and so the parent checkbox can compute `indeterminate` from its
 * rows. Ids come from `useId`, and the radio group's `name` is left for it to
 * generate, because the example is rendered twice by MotionModes and two
 * groups sharing a name would be one group.
 */
export function SelectionControlsDemoClient() {
  const id = useId();
  const [agreed, setAgreed] = useState(false);
  const [notify, setNotify] = useState(true);
  const [period, setPeriod] = useState<string>("monthly");
  const [selected, setSelected] = useState<boolean[]>(rows.map(() => false));

  const selectedCount = selected.filter(Boolean).length;
  const allSelected = selectedCount === rows.length;
  const someSelected = selectedCount > 0 && !allSelected;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-control-gap">
          <Checkbox id={`${id}-terms`} checked={agreed} onCheckedChange={setAgreed} />
          <Label htmlFor={`${id}-terms`} className="font-normal">
            I agree to the terms
          </Label>
        </div>
        <span className="text-caption text-foreground-muted" aria-live="polite">
          {agreed ? "Agreed" : "Not agreed"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-control-gap">
          <Switch id={`${id}-notify`} checked={notify} onCheckedChange={setNotify} />
          <Label htmlFor={`${id}-notify`} className="font-normal">
            Email notifications
          </Label>
        </div>
        <span className="text-caption text-foreground-muted" aria-live="polite">
          {notify ? "Notifications on" : "Notifications off"}
        </span>
      </div>

      <div className="grid gap-2">
        <RadioGroup label="Billing period" value={period} onValueChange={setPeriod}>
          {periods.map((option) => (
            <div key={option.value} className="flex items-center gap-control-gap">
              <Radio id={`${id}-${option.value}`} value={option.value} />
              <Label htmlFor={`${id}-${option.value}`} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        <span className="text-caption text-foreground-muted" aria-live="polite">
          Billing: {periods.find((option) => option.value === period)?.label ?? period}
        </span>
      </div>

      <div className="grid gap-2 rounded-surface border border-border bg-surface p-3">
        <div className="flex items-center gap-control-gap">
          <Checkbox
            id={`${id}-all`}
            checked={allSelected}
            indeterminate={someSelected}
            onCheckedChange={(checked) => setSelected(rows.map(() => checked))}
          />
          <Label htmlFor={`${id}-all`} className="font-normal">
            All rows
          </Label>
        </div>
        {rows.map((row, index) => (
          <div key={row} className="flex items-center gap-control-gap pl-6">
            <Checkbox
              id={`${id}-row-${index}`}
              checked={selected[index] ?? false}
              onCheckedChange={(checked) =>
                setSelected((current) => current.map((value, i) => (i === index ? checked : value)))
              }
            />
            <Label htmlFor={`${id}-row-${index}`} className="font-normal">
              {row}
            </Label>
          </div>
        ))}
        <span className="text-caption text-foreground-muted" aria-live="polite">
          {selectedCount} of {rows.length} rows selected
          {someSelected ? ", so the parent is indeterminate" : ""}
        </span>
      </div>
    </div>
  );
}
