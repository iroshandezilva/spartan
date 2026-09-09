import { cssVar, remToPx, scalar } from "@/lib/tokens";

const ROLES = [
  ["display", "Marketing and empty states"],
  ["heading-large", "Page titles"],
  ["heading", "Page sections"],
  ["heading-small", "Card and section titles"],
  ["body-large", "Lead paragraphs"],
  ["body", "Default reading size"],
  ["body-small", "Dense UI, table cells"],
  ["caption", "Metadata, timestamps"],
] as const;

const SPECIMEN = "The quick brown fox jumps over the lazy dog";

function isHeading(role: string): boolean {
  return role.startsWith("heading") || role === "display";
}

/**
 * Every type role at real size, set with the same custom properties a
 * component would use, so what is on screen is what the package renders.
 */
export function TypeSpecimens() {
  return (
    <ul className="not-prose grid gap-5 rounded-surface border border-border bg-surface p-6 shadow-surface">
      {ROLES.map(([role, use]) => {
        const heading = isHeading(role);
        const lineHeight = heading ? "font.line-height.heading" : "font.line-height.body";
        const tracking = heading ? "font.tracking.heading" : "font.tracking.body";
        const weight = heading ? "font.weight.heading" : "font.weight.body";
        return (
          <li key={role} className="grid gap-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-caption text-foreground-muted">
              <code className="font-mono text-foreground">font.size.{role}</code>
              <span>
                {scalar(`font.size.${role}`)}, {remToPx(scalar(`font.size.${role}`))}
              </span>
              <span>line height {scalar(lineHeight)}</span>
              <span>weight {scalar(weight)}</span>
              <span>tracking {scalar(tracking)}</span>
              <span>{use}</span>
            </div>
            <p
              className="text-foreground"
              style={{
                fontSize: cssVar(`font.size.${role}`),
                lineHeight: cssVar(lineHeight),
                letterSpacing: cssVar(tracking),
                fontWeight: cssVar(weight),
              }}
            >
              {SPECIMEN}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

/** The type roles as a table, with the pixel size at the browser default. */
export function TypeTable() {
  return (
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Size</th>
          <th>Pixels</th>
          <th>Line height</th>
          <th>Weight</th>
          <th>Tracking</th>
          <th>Use</th>
        </tr>
      </thead>
      <tbody>
        {ROLES.map(([role, use]) => {
          const heading = isHeading(role);
          return (
            <tr key={role}>
              <td>
                <code>font.size.{role}</code>
              </td>
              <td>
                <code>{scalar(`font.size.${role}`)}</code>
              </td>
              <td>{remToPx(scalar(`font.size.${role}`))}</td>
              <td>{scalar(heading ? "font.line-height.heading" : "font.line-height.body")}</td>
              <td>{scalar(heading ? "font.weight.heading" : "font.weight.body")}</td>
              <td>{scalar(heading ? "font.tracking.heading" : "font.tracking.body")}</td>
              <td>{use}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
