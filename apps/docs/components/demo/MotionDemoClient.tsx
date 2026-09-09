"use client";

import { Button, cn } from "@iroshandezilva/spartant";
import { type CSSProperties, useId, useState, useSyncExternalStore } from "react";

export interface MotionDemoValues {
  pressDuration: string;
  pressScale: string;
  stateDuration: string;
  overlayEnter: string;
  overlayExit: string;
  overlayScale: string;
  overlayDistance: string;
  reducedDuration: string;
  reducedScale: string;
}

interface MotionDemoClientProps {
  /** Custom property overrides that simulate `prefers-reduced-motion: reduce`. */
  reducedOverrides: Record<string, string>;
  values: MotionDemoValues;
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(notify: () => void): () => void {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
}

/** Whether the visitor's operating system asks for reduced motion. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

interface PanelProps {
  title: string;
  description: string;
  /** Inline custom properties applied to the panel's subtree. */
  style?: CSSProperties;
  values: MotionDemoValues;
  reduced: boolean;
}

/**
 * One panel of the demo. The two panels are identical code; only the custom
 * properties on the wrapper differ, which is the whole point: a component that
 * reads the tokens needs no branch of its own to respect reduced motion.
 */
function Panel({ title, description, style, values, reduced }: PanelProps) {
  const headingId = useId();
  const [on, setOn] = useState(false);
  const [toggles, setToggles] = useState(0);
  const [open, setOpen] = useState(false);
  const [presses, setPresses] = useState(0);

  const duration = reduced ? values.reducedDuration : values.stateDuration;
  const scale = reduced ? values.reducedScale : values.pressScale;

  return (
    <section
      aria-labelledby={headingId}
      style={style}
      className="grid content-start gap-4 rounded-surface border border-border bg-surface p-5 shadow-surface"
    >
      <div>
        <h3 id={headingId} className="text-body font-medium text-foreground">
          {title}
        </h3>
        <p className="text-caption text-foreground-muted">{description}</p>
      </div>

      <div className="grid gap-1">
        <p className="text-body-small font-medium text-foreground">Press feedback</p>
        <p className="text-caption text-foreground-muted">
          Hold the pointer down. Scale {scale} over{" "}
          {reduced ? values.reducedDuration : values.pressDuration}.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => setPresses((count) => count + 1)}>
            Press and hold
          </Button>
          <span className="text-caption text-foreground-muted" aria-live="polite">
            Activated {presses} {presses === 1 ? "time" : "times"}
          </span>
        </div>
      </div>

      <div className="grid gap-1">
        <p className="text-body-small font-medium text-foreground">State change</p>
        <p className="text-caption text-foreground-muted">
          Colour only, over {duration}. Click twice quickly: the transition retargets, and the
          readout flips on the click, never on the transition.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-pressed={on}
            onClick={() => {
              setOn((value) => !value);
              setToggles((count) => count + 1);
            }}
            className={cn(
              "inline-flex h-[var(--spartant-size-min-target)] items-center rounded-control px-4 text-body-small font-medium",
              "transition-[background-color,color] duration-state ease-state",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              on
                ? "bg-success text-success-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
            )}
          >
            {on ? "On" : "Off"}
          </button>
          <span className="text-caption text-foreground-muted" aria-live="polite">
            State is {on ? "on" : "off"} after {toggles} {toggles === 1 ? "toggle" : "toggles"}
          </span>
        </div>
      </div>

      <div className="grid gap-1">
        <p className="text-body-small font-medium text-foreground">Overlay</p>
        <p className="text-caption text-foreground-muted">
          Enters from its trigger by {reduced ? "0px" : values.overlayDistance} at scale{" "}
          {reduced ? values.reducedScale : values.overlayScale} over{" "}
          {reduced ? values.reducedDuration : values.overlayEnter}, leaves over{" "}
          {reduced ? values.reducedDuration : values.overlayExit}. <code>aria-expanded</code> flips
          on the click.
        </p>
        <div className="relative">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className={cn(
              "inline-flex h-[var(--spartant-size-min-target)] items-center rounded-control bg-secondary px-4 text-body-small font-medium text-secondary-foreground",
              "hover:bg-secondary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            )}
          >
            {open ? "Hide" : "Show"} overlay
          </button>
          <div
            inert={!open}
            className={cn(
              "absolute top-full left-0 z-10 mt-2 w-56 rounded-surface border border-border",
              "bg-surface-elevated p-3 text-caption text-foreground shadow-overlay",
              "transition-[opacity,transform]",
              open ? "opacity-100" : "opacity-0",
            )}
            style={{
              transform: open
                ? "translateY(0) scale(1)"
                : "translateY(calc(-1 * var(--spartant-distance-overlay))) scale(var(--spartant-scale-overlay-enter))",
              transitionDuration: open
                ? "var(--spartant-duration-overlay-enter)"
                : "var(--spartant-duration-overlay-exit)",
              transitionTimingFunction: open
                ? "var(--spartant-easing-enter)"
                : "var(--spartant-easing-exit)",
            }}
          >
            Origin-aware entry, faster exit. Inert while closed, so it is never reachable by
            keyboard or assistive technology.
          </div>
        </div>
        <p className="text-caption text-foreground-muted" aria-live="polite">
          Overlay is {open ? "open" : "closed"}
        </p>
      </div>
    </section>
  );
}

/**
 * Normal motion and reduced motion side by side.
 *
 * The right panel sets the same custom properties the package's
 * `prefers-reduced-motion` rule sets, on its own subtree. Every control in
 * both panels flips its state and its `aria-*` attribute in the click
 * handler, so nothing waits for a transition to finish in either mode.
 */
export function MotionDemoClient({ reducedOverrides, values }: MotionDemoClientProps) {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className="not-prose grid gap-4">
      <p className="text-body-small text-foreground-muted">
        {prefersReduced
          ? "Your operating system asks for reduced motion, so the package has already collapsed the motion tokens and both panels behave the same. Turn the preference off to see the difference."
          : "Your operating system does not ask for reduced motion. The left panel runs the normal tokens; the right panel overrides them exactly as the package does under prefers-reduced-motion: reduce."}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          title="Normal motion"
          description="The tokens as shipped."
          values={values}
          reduced={false}
        />
        <Panel
          title="Reduced motion"
          description="Durations to 0ms, scales to 1, distances to 0px, on this subtree only."
          style={reducedOverrides as CSSProperties}
          values={values}
          reduced
        />
      </div>
    </div>
  );
}
