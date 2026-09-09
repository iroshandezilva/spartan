import { cssVar, primitiveTokens, remToPx, rolesUnder } from "@/lib/tokens";

/** The primitive spacing steps, in scale order rather than alphabetical. */
function primitiveSteps(): Array<[string, string]> {
  return Object.entries(primitiveTokens)
    .filter((entry): entry is [string, string] => {
      return entry[0].startsWith("space.") && typeof entry[1] === "string";
    })
    .map(([path, value]): [string, string] => [path.slice("space.".length), value])
    .sort((a, b) => Number.parseFloat(a[1]) - Number.parseFloat(b[1]));
}

/** The primitive scale as bars, so the gaps between steps are visible. */
export function SpacingPrimitives() {
  return (
    <ul className="not-prose grid gap-2 rounded-surface border border-border bg-surface p-6 shadow-surface">
      {primitiveSteps().map(([step, value]) => (
        <li key={step} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption">
          <code className="w-16 shrink-0 font-mono text-foreground-muted">{step}</code>
          {/* shrink-0 keeps the bar at its true width in a narrow viewport; the
              row wraps instead, because a bar that shrinks misreports the token. */}
          <div
            aria-hidden="true"
            className="h-3 shrink-0 rounded-sm bg-primary"
            style={{ width: value, minWidth: value === "0rem" ? "0" : "1px" }}
          />
          <span className="font-mono text-foreground-muted">
            {value}, {remToPx(value)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The semantic spacing roles as bars, drawn with the live custom property. */
export function SpacingRoles() {
  return (
    <ul className="not-prose grid gap-3 rounded-surface border border-border bg-surface p-6 shadow-surface">
      {rolesUnder("space").map(({ path, role, value }) => (
        <li key={path} className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption">
          <code className="w-44 shrink-0 font-mono text-foreground">space.{role}</code>
          <div
            aria-hidden="true"
            className="h-4 shrink-0 rounded-sm bg-primary"
            style={{ width: cssVar(path) }}
          />
          <span className="font-mono text-foreground-muted">
            {typeof value === "string" ? `${value}, ${remToPx(value)}` : String(value)}
          </span>
        </li>
      ))}
    </ul>
  );
}
