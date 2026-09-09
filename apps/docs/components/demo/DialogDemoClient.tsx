"use client";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@iroshandezilva/spartant";
import { useState } from "react";

/**
 * One confirmation dialog, controlled through `open` and `onOpenChange` so
 * the readout can count. `DialogTrigger` still opens it: in controlled mode
 * the trigger reports through `onOpenChange` rather than holding state.
 *
 * The readout flips in `onOpenChange`, which runs from every dismissal path
 * (Escape, the Cancel control, a backdrop click, and the confirm button), and
 * never at the end of a transition. The dialog is rendered in place, not in
 * a portal, so under the reduced-motion panel it inherits the collapsed
 * tokens even though `showModal()` paints it in the top layer.
 */
export function DialogDemoClient() {
  const [open, setOpen] = useState(false);
  const [opens, setOpens] = useState(0);
  const [deleted, setDeleted] = useState(0);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (next) setOpens((count) => count + 1);
          }}
        >
          <DialogTrigger className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control bg-primary px-control-x font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
            Delete workspace
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Delete this workspace?</DialogTitle>
            <DialogDescription>
              Everything in it goes with it. This cannot be undone.
            </DialogDescription>
            <div className="flex justify-end gap-control-gap">
              <DialogClose className="inline-flex h-[var(--spartant-button-height-md)] items-center rounded-control px-control-x font-medium text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring">
                Cancel
              </DialogClose>
              <Button
                variant="danger"
                onClick={() => {
                  setDeleted((count) => count + 1);
                  setOpen(false);
                }}
              >
                Delete workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <span className="text-caption text-foreground-muted" aria-live="polite">
          {open
            ? "Open"
            : `Closed. Opened ${opens} ${opens === 1 ? "time" : "times"}, deleted ${deleted} ${deleted === 1 ? "time" : "times"}.`}
        </span>
      </div>
      <p className="text-caption text-foreground-muted">
        Not a portal: the dialog is a descendant of this panel even while it sits in the top layer,
        which is why the reduced copy opens without scaling or fading.
      </p>
    </div>
  );
}
