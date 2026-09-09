import type { ReactNode } from "react";

/**
 * The labelled grid the `States`, `Variants`, and `Sizes` stories render into.
 *
 * A state story exists to be compared, not admired: the value is in seeing
 * disabled next to invalid next to loading in one view, in the theme currently
 * selected. Each case carries its own label so a screenshot or a shared link is
 * self-describing, and so a reviewer can say which case is wrong.
 */
export function StateMatrix({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

export interface StateCaseProps {
  /** The state, variant, or size this case shows. Matches the contract's name. */
  label: string;
  /** How to read the case: what was forced, or what to look at. */
  note?: string;
  children: ReactNode;
}

/**
 * One labelled cell in a {@link StateMatrix}.
 *
 * `justify-items-start` matters more than it looks: a grid stretches its
 * children, so without it a button renders at the full column width and the
 * size scale becomes invisible. A case shows the component at its natural size.
 * A story that wants a full-width example can say so itself.
 */
export function StateCase({ label, note, children }: StateCaseProps) {
  return (
    <section className="grid content-start justify-items-start gap-3 rounded-surface border border-border-subtle p-4">
      <header className="grid gap-0.5">
        <h3 className="font-mono text-caption text-foreground">{label}</h3>
        {note ? <p className="text-caption text-foreground-muted">{note}</p> : null}
      </header>
      {children}
    </section>
  );
}
