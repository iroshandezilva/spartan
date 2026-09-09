import { toHex } from "@/lib/contrast";
import { type ColorRole, colorRoles } from "@/lib/tokens";

interface ColorRolesProps {
  /** The role group, for example `surface` for every `color.surface.*` role. */
  group: string;
}

function Swatch({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block size-6 shrink-0 rounded-control border border-border-strong"
        style={{ background: value }}
      />
      <span className="font-mono text-caption">
        <span className="sr-only">{label} </span>
        {toHex(value)}
      </span>
    </span>
  );
}

function Row({ role }: { role: ColorRole }) {
  return (
    <tr>
      <td>
        <code>{role.role}</code>
      </td>
      <td>
        <Swatch value={role.light} label="light" />
      </td>
      <td>
        <Swatch value={role.dark} label="dark" />
      </td>
      <td>
        <code className="text-caption">{role.variable}</code>
      </td>
    </tr>
  );
}

/**
 * Every colour role in a group, with its light and dark values.
 *
 * Both swatches are painted with the literal values from the published token
 * JSON rather than with the live custom property, so the two themes sit side
 * by side whatever theme this site is currently showing. The hex beside each
 * swatch is derived from the same `oklch()` value for readers whose tools do
 * not speak OKLCH.
 */
export function ColorRoles({ group }: ColorRolesProps) {
  const roles = colorRoles(group);
  if (roles.length === 0) throw new Error(`No colour roles in group ${group}`);

  return (
    <table>
      <thead>
        <tr>
          <th>Role</th>
          <th>Light</th>
          <th>Dark</th>
          <th>Custom property</th>
        </tr>
      </thead>
      <tbody>
        {roles.map((role) => (
          <Row key={role.path} role={role} />
        ))}
      </tbody>
    </table>
  );
}
