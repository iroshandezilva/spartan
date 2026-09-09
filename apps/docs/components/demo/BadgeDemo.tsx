import { Badge, type BadgeVariant } from "@iroshandezilva/spartant";

const variants: readonly BadgeVariant[] = [
  "neutral",
  "primary",
  "accent",
  "success",
  "warning",
  "danger",
  "information",
];

/**
 * The Badge example, rendered live and directly. There is no MotionModes
 * wrapper because Badge has no motion: nothing here changes in response to
 * the reader, so there is nothing a reduced-motion copy could show.
 *
 * A server component, because the example holds no state. The last row is
 * the one way to make a badge interactive: a real button around it, which
 * brings focus and a hit area the span never acquires.
 */
export function BadgeDemo() {
  return (
    <div className="not-prose grid gap-4 rounded-surface border border-border bg-surface p-5 shadow-surface">
      <div className="grid gap-2">
        <p className="text-caption text-foreground-muted">Every variant, named for what it means</p>
        <div className="flex flex-wrap items-center gap-2">
          {variants.map((variant) => (
            <Badge key={variant} variant={variant}>
              {variant === "neutral" ? "Draft" : variant}
            </Badge>
          ))}
        </div>
      </div>
      <div className="grid gap-2">
        <p className="text-caption text-foreground-muted">Inline in running text</p>
        <p className="text-body-small text-foreground">
          Merged into <Badge>main</Badge> yesterday, and now waiting on{" "}
          <Badge variant="danger">2 failing checks</Badge> before it can ship. The label says what
          happened, so the colour is reinforcement rather than the message.
        </p>
      </div>
      <div className="grid gap-2">
        <p className="text-caption text-foreground-muted">
          A decorative glyph, hidden because the label is already the name
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success">
            <span aria-hidden="true">&#9679;</span>
            Live
          </Badge>
          <Badge variant="warning">
            <span aria-hidden="true">&#9679;</span>
            Degraded
          </Badge>
        </div>
      </div>
      <div className="grid gap-2">
        <p className="text-caption text-foreground-muted">
          Made interactive by composition: Tab reaches the button, never the badge
        </p>
        <button
          type="button"
          className="inline-flex w-fit rounded-pill focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          <Badge variant="primary">Filter by: Frontend</Badge>
        </button>
      </div>
    </div>
  );
}
