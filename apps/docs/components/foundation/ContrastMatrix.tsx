import { contrastRatio } from "@/lib/contrast";
import { type Pairing, type PairingKind, REQUIRED_PAIRINGS, THRESHOLDS } from "@/lib/pairings";
import { colorRole } from "@/lib/tokens";

export interface Measured {
  pairing: Pairing;
  light: number;
  dark: number;
  required: number;
}

export function measure(pairing: Pairing): Measured {
  const foreground = colorRole(pairing.foreground);
  const background = colorRole(pairing.background);
  return {
    pairing,
    light: contrastRatio(foreground.light, background.light),
    dark: contrastRatio(foreground.dark, background.dark),
    required: THRESHOLDS[pairing.kind],
  };
}

export const KIND_LABEL: Record<PairingKind, string> = {
  "body-text": "Body text, 4.5:1",
  "large-text": "Large text, 3:1",
  "non-text": "Non-text, 3:1",
  disabled: "Disabled, exempt",
};

export function shortRole(path: string): string {
  return path.replace(/^color\./, "").replace(/\.default$/, "");
}

function Ratio({ value, required }: { value: number; required: number }) {
  const passes = value >= required;
  return (
    <span className={passes ? undefined : "font-medium text-danger-text"}>
      {value.toFixed(2)}:1{passes ? "" : " fails"}
    </span>
  );
}

/**
 * Every required pairing, measured in both themes from the published token
 * values. The list mirrors the audit the build runs; the figures are computed
 * here at build time so they cannot go stale.
 */
export function ContrastMatrix() {
  const measured = REQUIRED_PAIRINGS.map(measure);
  const checks = measured.length * 2;
  const failures = measured.filter(
    (entry) => entry.light < entry.required || entry.dark < entry.required,
  );
  const kinds: PairingKind[] = ["body-text", "non-text", "disabled"];

  return (
    <>
      <p>
        <strong>{measured.length} required pairings</strong>, {checks} checks across the two themes,{" "}
        {failures.length === 0 ? "all passing" : `${failures.length} failing`}, measured from the
        committed token values.
      </p>
      {kinds.map((kind) => {
        const rows = measured.filter((entry) => entry.pairing.kind === kind);
        if (rows.length === 0) return null;
        return (
          <table key={kind}>
            <caption className="text-left font-medium">{KIND_LABEL[kind]}</caption>
            <thead>
              <tr>
                <th>Foreground</th>
                <th>Background</th>
                <th>Light</th>
                <th>Dark</th>
                <th>Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={`${entry.pairing.foreground}/${entry.pairing.background}`}>
                  <td>
                    <code>{shortRole(entry.pairing.foreground)}</code>
                  </td>
                  <td>
                    <code>{shortRole(entry.pairing.background)}</code>
                  </td>
                  <td>
                    <Ratio value={entry.light} required={entry.required} />
                  </td>
                  <td>
                    <Ratio value={entry.dark} required={entry.required} />
                  </td>
                  <td>{entry.pairing.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      })}
    </>
  );
}
