"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@iroshandezilva/spartant";
import { useState } from "react";

/**
 * The look of a secondary Button, applied to the trigger. `TooltipTrigger`
 * renders an unstyled native button and leaves its appearance to the caller,
 * so the classes here are the ones the stories use for the same purpose.
 */
const triggerClass =
  "inline-flex h-[var(--spartant-button-height-md)] items-center justify-center gap-control-gap rounded-control bg-secondary px-[var(--spartant-button-padding-x-md)] font-sans font-medium text-secondary-foreground hover:bg-secondary-hover aria-disabled:cursor-not-allowed aria-disabled:bg-surface-disabled aria-disabled:text-foreground-disabled focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

/** A square icon-only trigger for the toolbar. */
const iconTriggerClass =
  "inline-flex size-[var(--spartant-button-height-md)] items-center justify-center rounded-control bg-transparent text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring";

const tools = [
  { label: "Bold", shortcut: "Cmd+B", d: "M6 4h5a3 3 0 0 1 0 6H6zM6 10h6a3 3 0 0 1 0 6H6z" },
  { label: "Italic", shortcut: "Cmd+I", d: "M8 4h6M6 16h6M12 4l-4 12" },
  {
    label: "Link",
    shortcut: "Cmd+K",
    d: "M8 12l4-4M6 14a3 3 0 0 1 0-4l2-2M14 6a3 3 0 0 1 0 4l-2 2",
  },
] as const;

function Glyph({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

/**
 * A toolbar of icon-only triggers, one named trigger, and one disabled
 * trigger whose tooltip says why. The readout is driven by `onOpenChange`,
 * which fires in the event handler for every path (hover, focus, Escape,
 * blur, press), so it flips before the surface has finished its transition.
 */
export function TooltipDemoClient() {
  const [openLabel, setOpenLabel] = useState<string | null>(null);

  const report = (label: string) => (open: boolean) =>
    setOpenLabel((current) => (open ? label : current === label ? null : current));

  return (
    <div className="grid gap-3">
      <div
        role="toolbar"
        aria-label="Formatting"
        className="inline-flex w-max gap-control-gap rounded-surface border border-border bg-surface p-[var(--spartant-space-control-gap)]"
      >
        {tools.map(({ label, shortcut, d }) => (
          <Tooltip key={label} onOpenChange={report(label)}>
            <TooltipTrigger className={iconTriggerClass} aria-label={label}>
              <Glyph d={d} />
            </TooltipTrigger>
            <TooltipContent placement="bottom">
              {label} {shortcut}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Tooltip onOpenChange={report("Save draft")}>
          <TooltipTrigger className={triggerClass}>Save draft</TooltipTrigger>
          <TooltipContent>Saves without publishing. Cmd+S</TooltipContent>
        </Tooltip>
        <Tooltip onOpenChange={report("Publish")}>
          <TooltipTrigger className={triggerClass} disabled>
            Publish
          </TooltipTrigger>
          <TooltipContent>Add a title before publishing</TooltipContent>
        </Tooltip>
      </div>
      <span className="text-caption text-foreground-muted" aria-live="polite">
        {openLabel ? `Open: ${openLabel}` : "No tooltip open"}
      </span>
    </div>
  );
}
