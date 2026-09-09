import { cn, springs } from "@iroshandezilva/spartant";
import { useState } from "react";
import { rolesIn, roleValue } from "./tokens.js";

/** How much slower the slow-motion view runs. */
const SLOW_FACTOR = 8;

/**
 * Motion specimens.
 *
 * The two controls exist because the standard's manual review asks for motion
 * at normal and slowed playback, and under reduced motion. Both work by
 * overriding the motion tokens on this subtree, which is the same mechanism the
 * real reduced-motion rule uses. If a demo below ignored a control, it would be
 * reaching past a token for a raw value.
 */
export function Motion() {
  const [slow, setSlow] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [open, setOpen] = useState(false);
  const [on, setOn] = useState(false);

  // Durations come from the tokens, never restated here. An earlier draft
  // hardcoded the base values, which meant a token change would have left the
  // slow-motion demo quietly running at the old speed.
  const durationRoles = rolesIn("duration")
    .map(([role]) => role)
    .filter((role) => role !== "reduced");

  const overrides: Record<string, string> = {};
  if (reduced) {
    // The reduced values are themselves tokens, so this simulation matches what
    // the real prefers-reduced-motion rule does rather than approximating it.
    for (const role of durationRoles) {
      overrides[`--spartant-duration-${role}`] = roleValue("duration.reduced");
    }
    overrides["--spartant-scale-press"] = roleValue("scale.reduced");
    overrides["--spartant-scale-overlay-enter"] = roleValue("scale.reduced");
    for (const [role] of rolesIn("distance")) {
      overrides[`--spartant-distance-${role}`] = "0px";
    }
  } else if (slow) {
    // Eight times slower. Enough to watch an easing curve without the page
    // feeling broken.
    for (const role of durationRoles) {
      const base = Number.parseFloat(roleValue(`duration.${role}`));
      overrides[`--spartant-duration-${role}`] = `${base * SLOW_FACTOR}ms`;
    }
  }

  return (
    <section aria-labelledby="motion-heading" className="grid gap-4">
      <h2 id="motion-heading" className="text-heading font-semibold tracking-heading">
        Motion
      </h2>
      <p className="text-body-small text-foreground-muted">
        Provisional until HAUX-68 validates these against real components.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={slow}
          onClick={() => {
            setSlow((value) => !value);
            setReduced(false);
          }}
          className={cn(
            "rounded-control px-3 py-1.5 text-body-small font-medium",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            slow ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
          )}
        >
          Slow motion, 8x
        </button>
        <button
          type="button"
          aria-pressed={reduced}
          onClick={() => {
            setReduced((value) => !value);
            setSlow(false);
          }}
          className={cn(
            "rounded-control px-3 py-1.5 text-body-small font-medium",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            reduced
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          Simulate reduced motion
        </button>
      </div>

      <div
        style={overrides}
        data-testid="motion-stage"
        className="grid gap-6 rounded-surface border border-border bg-surface p-6 shadow-surface sm:grid-cols-3"
      >
        <div className="grid gap-2">
          <h3 className="text-body-small font-medium">Press feedback</h3>
          <p className="text-caption text-foreground-muted">
            Pointer and touch scale to 0.97. Keyboard activation is immediate, with no scale.
          </p>
          <button
            type="button"
            data-testid="press-demo"
            className={cn(
              "rounded-control bg-primary px-4 py-2 text-body-small font-medium text-primary-foreground",
              "transition-transform ease-enter",
              "active:scale-[var(--spartant-scale-press)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            )}
            style={{ transitionDuration: "var(--spartant-duration-press-feedback)" }}
          >
            Press and hold
          </button>
        </div>

        <div className="grid gap-2">
          <h3 className="text-body-small font-medium">State change</h3>
          <p className="text-caption text-foreground-muted">
            Colour only. Click quickly: a transition retargets rather than queueing.
          </p>
          <button
            type="button"
            data-testid="state-demo"
            aria-pressed={on}
            onClick={() => setOn((value) => !value)}
            className={cn(
              "rounded-control px-4 py-2 text-body-small font-medium transition-colors ease-state",
              on
                ? "bg-success text-success-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
            )}
            style={{ transitionDuration: "var(--spartant-duration-state-change)" }}
          >
            {on ? "On" : "Off"}
          </button>
        </div>

        <div className="grid gap-2">
          <h3 className="text-body-small font-medium">Overlay</h3>
          <p className="text-caption text-foreground-muted">
            Enters from its trigger and leaves faster than it arrives.
          </p>
          <div className="relative">
            <button
              type="button"
              data-testid="overlay-trigger"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              className={cn(
                "rounded-control bg-secondary px-4 py-2 text-body-small font-medium text-secondary-foreground",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
              )}
            >
              {open ? "Hide" : "Show"} overlay
            </button>
            <div
              data-testid="overlay"
              hidden={!open}
              className={cn(
                "absolute top-full left-0 mt-2 w-48 rounded-surface border border-border",
                "bg-surface-elevated p-3 text-caption shadow-overlay",
                "transition-[opacity,transform]",
                open ? "opacity-100" : "pointer-events-none opacity-0",
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
              Origin-aware entry, faster exit.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-surface border border-border bg-surface p-6 shadow-surface">
        <h3 className="text-body-small font-medium">Springs</h3>
        <p className="mt-1 text-caption text-foreground-muted">
          Typed tokens, not custom properties. CSS has no spring primitive, so these wait for an
          animation library rather than shipping as a string nothing reads.
        </p>
        <dl className="mt-3 grid gap-2 text-caption sm:grid-cols-2">
          {Object.entries(springs).map(([name, spring]) => (
            <div key={name} className="rounded-control bg-surface-muted p-3">
              <dt className="font-medium">{name}</dt>
              <dd className="font-mono text-foreground-muted">
                stiffness {spring.stiffness}, damping {spring.damping}, mass {spring.mass}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
