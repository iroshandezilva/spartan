"use client";

import { type CSSProperties, type ReactNode, useId, useSyncExternalStore } from "react";

interface MotionModesClientProps {
  children: ReactNode;
  hint?: string;
  /** Custom property overrides that simulate `prefers-reduced-motion: reduce`. */
  reducedOverrides: Record<string, string>;
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
  style?: CSSProperties;
  children: ReactNode;
}

function Panel({ title, description, style, children }: PanelProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      style={style}
      data-motion-mode={style ? "reduced" : "normal"}
      className="grid content-start gap-4 rounded-surface border border-border bg-surface p-5 shadow-surface"
    >
      <div>
        <h3 id={headingId} className="text-body font-medium text-foreground">
          {title}
        </h3>
        <p className="text-caption text-foreground-muted">{description}</p>
      </div>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

/**
 * The same example under normal motion and under reduced motion, side by
 * side.
 *
 * The two panels render the same children. The right panel sets the same
 * custom properties the package's `prefers-reduced-motion` rule sets, on its
 * own subtree, so the component inside needs no branch of its own. Every
 * state change in both panels happens in the event handler, never at the end
 * of a transition, which is the contract the motion standard sets and what a
 * reader can verify here with a keyboard.
 */
export function MotionModesClient({ children, hint, reducedOverrides }: MotionModesClientProps) {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <div className="not-prose grid gap-4">
      <p className="text-body-small text-foreground-muted">
        {prefersReduced
          ? "Your operating system asks for reduced motion, so the package has already collapsed the motion tokens and both copies behave the same. Turn the preference off to see the difference."
          : "Your operating system does not ask for reduced motion. The left copy runs the tokens as shipped; the right copy overrides them exactly as the package does under prefers-reduced-motion: reduce."}
        {hint ? ` ${hint}` : null}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Normal motion" description="The motion tokens as shipped.">
          {children}
        </Panel>
        <Panel
          title="Reduced motion"
          description="Durations to 0ms, scales to 1, distances to 0px, on this subtree only."
          style={reducedOverrides as CSSProperties}
        >
          {children}
        </Panel>
      </div>
      <p className="text-caption text-foreground-muted">
        CSS transitions only. No animation library is involved in either copy.
      </p>
    </div>
  );
}
