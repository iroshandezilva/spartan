import {
  cssVariable,
  isShadow,
  isSpring,
  remToPx,
  rolesUnder,
  shadowToCss,
  type TokenValue,
} from "@/lib/tokens";

interface TokenTableProps {
  /** Semantic prefix, for example `space` or `font.size`. */
  prefix: string;
  /** Show a pixel column for rem values. */
  px?: boolean;
}

function display(value: TokenValue): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (isShadow(value)) return shadowToCss(value);
  if (isSpring(value)) {
    return `stiffness ${value.stiffness}, damping ${value.damping}, mass ${value.mass}`;
  }
  return JSON.stringify(value);
}

/**
 * Every semantic role under a prefix, with its resolved value and the custom
 * property that carries it. Read from the published token JSON at build time.
 */
export function TokenTable({ prefix, px = false }: TokenTableProps) {
  const roles = rolesUnder(prefix);
  if (roles.length === 0) throw new Error(`No semantic roles under ${prefix}`);

  return (
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Value</th>
          {px ? <th>Pixels</th> : null}
          <th>Custom property</th>
        </tr>
      </thead>
      <tbody>
        {roles.map(({ path, role, value }) => (
          <tr key={path}>
            <td>
              <code>
                {prefix}.{role}
              </code>
            </td>
            <td>
              <code>{display(value)}</code>
            </td>
            {px ? <td>{typeof value === "string" ? remToPx(value) : ""}</td> : null}
            <td>
              <code className="text-caption">
                {isSpring(value) ? "none, typed export only" : cssVariable(path)}
              </code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
