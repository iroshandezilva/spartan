import { Separator } from "@iroshandezilva/spartant";

/**
 * The Separator example, rendered once and directly. There is no client half
 * and no MotionModes wrapper: the component has no motion contract, so a
 * reduced-motion copy would be identical to the normal one.
 *
 * Three lines: a decorative horizontal rule between two paragraphs, a
 * decorative vertical rule inside a flex row (the parent supplies the height),
 * and a semantic horizontal rule that assistive technology reports. The
 * semantic one looks the same as the decorative one, which is the point.
 */
export function SeparatorDemo() {
  return (
    <div className="not-prose grid gap-4 rounded-surface border border-border bg-surface p-5 shadow-surface">
      <div>
        <p className="text-caption text-foreground-muted">Horizontal, decorative</p>
        <p className="mt-2 text-body text-foreground">Above the line.</p>
        <Separator className="my-3" />
        <p className="text-body text-foreground">Below it.</p>
      </div>
      <div>
        <p className="text-caption text-foreground-muted">Vertical, decorative</p>
        <div className="mt-2 flex h-12 items-stretch gap-3">
          <span className="self-center text-body text-foreground">Left</span>
          <Separator orientation="vertical" />
          <span className="self-center text-body text-foreground">Right</span>
        </div>
      </div>
      <div>
        <p className="text-caption text-foreground-muted">
          Horizontal, semantic. Reported as a separator with its orientation, and visually identical
          to the first.
        </p>
        <p className="mt-2 text-body text-foreground">Workspace settings.</p>
        <Separator decorative={false} className="my-3" />
        <p className="text-body text-foreground">Billing.</p>
      </div>
    </div>
  );
}
