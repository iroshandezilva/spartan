"use client";

import { Button, type ButtonVariant } from "@iroshandezilva/spartant";
import { useEffect, useRef, useState } from "react";

const variants: readonly ButtonVariant[] = ["primary", "secondary", "danger", "ghost"];

/**
 * A row of every variant, and one button that loads for a moment when
 * pressed. The readout flips in the click handler, before any transition,
 * and the loading button keeps focus while it is busy: Tab to it, press
 * Space, and focus is still there when the label returns.
 */
export function ButtonDemoClient() {
  const [loading, setLoading] = useState(false);
  const [saves, setSaves] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          loading={loading}
          onClick={() => {
            setLoading(true);
            setSaves((count) => count + 1);
            timer.current = window.setTimeout(() => setLoading(false), 1500);
          }}
        >
          Save changes
        </Button>
        <span className="text-caption text-foreground-muted" aria-live="polite">
          {loading ? "Saving" : `Saved ${saves} ${saves === 1 ? "time" : "times"}`}
        </span>
      </div>
    </div>
  );
}
