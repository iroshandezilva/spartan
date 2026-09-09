"use client";

import {
  Button,
  Field,
  Input,
  Label,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@iroshandezilva/spartant";
import { useState } from "react";

/**
 * The trigger parts render their own unstyled `button`, so the caller styles
 * them. This is the look of a secondary Button, including the shared focus
 * treatment, which the parts do not ship on their own.
 */
const triggerClass =
  "inline-flex h-[var(--spartant-button-height-md)] items-center justify-center gap-control-gap rounded-control bg-secondary px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-secondary-foreground hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const closeClass =
  "inline-flex h-[var(--spartant-button-height-sm)] items-center rounded-control px-[var(--spartant-button-padding-x-sm)] font-sans text-body-small font-medium text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/**
 * Two popovers: the recommended composition, a small form that does not need
 * the whole page, and a text-only surface placed above its trigger, where
 * focus stays on the trigger because there is nothing inside to focus.
 *
 * The readout flips in `onOpenChange`, which every path reports through, so
 * it changes on the keypress or the click and never at the end of the exit
 * transition. Only one `auto` popover can be open at a time, by platform
 * rule, so opening one closes whichever was open, in either panel.
 */
export function PopoverDemoClient() {
  const [shareOpen, setShareOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [changes, setChanges] = useState(0);

  const report = (set: (open: boolean) => void) => (open: boolean) => {
    set(open);
    setChanges((count) => count + 1);
  };

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Popover onOpenChange={report(setShareOpen)}>
          <PopoverTrigger className={triggerClass}>Share</PopoverTrigger>
          <PopoverContent>
            <div className="grid gap-stack">
              <div className="grid gap-1">
                <PopoverTitle>Share this document</PopoverTitle>
                <PopoverDescription>Anyone with the link can view.</PopoverDescription>
              </div>
              <Field>
                <Label>Link</Label>
                <Input readOnly defaultValue="https://example.com/d/4f2a" />
              </Field>
              <div className="flex justify-end gap-control-gap">
                <PopoverClose className={closeClass}>Done</PopoverClose>
                <Button size="sm">Copy link</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Popover onOpenChange={report(setStatusOpen)}>
          <PopoverTrigger className={triggerClass}>Status</PopoverTrigger>
          <PopoverContent placement="top">
            <PopoverTitle>All systems normal</PopoverTitle>
            <PopoverDescription>
              Nothing to focus in here, so focus stays on the trigger and Escape closes it from
              there.
            </PopoverDescription>
          </PopoverContent>
        </Popover>
      </div>
      <p className="text-caption text-foreground-muted" aria-live="polite">
        Share is {shareOpen ? "open" : "closed"}, Status is {statusOpen ? "open" : "closed"}.{" "}
        {changes} {changes === 1 ? "change" : "changes"} reported through onOpenChange.
      </p>
    </div>
  );
}
