import { cssVar, isShadow, remToPx, rolesUnder, shadowToCss } from "@/lib/tokens";

/** The radius roles on a real box, drawn with the live custom property. */
export function RadiusSamples() {
  return (
    <div className="not-prose flex flex-wrap gap-6 rounded-surface border border-border bg-surface p-6 shadow-surface">
      {rolesUnder("radius").map(({ path, role, value }) => (
        <div key={path} className="grid gap-1 text-caption">
          <div
            aria-hidden="true"
            className="size-20 border border-border-strong bg-surface-muted"
            style={{ borderRadius: cssVar(path) }}
          />
          <code className="font-mono text-foreground">radius.{role}</code>
          <span className="text-foreground-muted">
            {typeof value === "string" ? `${value}, ${remToPx(value)}` : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * The elevation roles, each on the surface and with the border it is paired
 * with. The pairing is the point: a shadow alone is nearly invisible in dark,
 * and in light `surface.elevated` cannot be lighter than `surface`.
 */
export const ELEVATION_PAIRING: Record<string, { border: string; surface: string }> = {
  flat: { border: "border-border", surface: "bg-surface" },
  surface: { border: "border-border-subtle", surface: "bg-surface" },
  overlay: { border: "border-border", surface: "bg-surface-elevated" },
  modal: { border: "border-border", surface: "bg-surface-elevated" },
};

export function ElevationSamples() {
  const pairing = ELEVATION_PAIRING;

  return (
    <div className="not-prose grid gap-6 rounded-surface border border-border bg-background p-6 sm:grid-cols-4">
      {rolesUnder("elevation").map(({ path, role, value }) => {
        const pair = pairing[role] ?? { border: "border-border", surface: "bg-surface" };
        return (
          <div key={path} className="grid gap-2 text-caption">
            <div
              aria-hidden="true"
              className={`h-24 rounded-surface border ${pair.border} ${pair.surface}`}
              style={{ boxShadow: cssVar(path) }}
            />
            <code className="font-mono text-foreground">elevation.{role}</code>
            <span className="font-mono text-foreground-muted">
              {isShadow(value) ? shadowToCss(value) : String(value)}
            </span>
            <span className="text-foreground-muted">
              with <code>{pair.border.replace("border-", "")}</code> on{" "}
              <code>{pair.surface.replace("bg-", "")}</code>
            </span>
          </div>
        );
      })}
    </div>
  );
}
