import { primitiveTokens } from "@/lib/tokens";

const FAMILIES = [
  "neutral",
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
  "information",
] as const;

const STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000] as const;

/**
 * The seven primitive families, thirteen steps each, from the published
 * token JSON.
 *
 * Primitives are shown here to explain the scale, not to be used. They are
 * deliberately not emitted as custom properties, so nothing on this page can
 * be copied into a component.
 */
export function ColorScale() {
  return (
    <div className="not-prose overflow-x-auto">
      <table className="w-full border-collapse text-caption">
        <thead>
          <tr>
            <th className="py-1 pr-3 text-left font-medium">Family</th>
            {STEPS.map((step) => (
              <th key={step} className="py-1 text-center font-medium">
                {step}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FAMILIES.map((family) => (
            <tr key={family}>
              <th scope="row" className="py-1 pr-3 text-left font-mono font-normal">
                {family}
              </th>
              {STEPS.map((step) => {
                const value = primitiveTokens[`color.${family}.${step}`];
                if (typeof value !== "string") {
                  throw new Error(`Missing primitive color.${family}.${step}`);
                }
                return (
                  <td key={step} className="p-0.5">
                    <div
                      className="h-8 min-w-8 rounded-sm border border-border-subtle"
                      style={{ background: value }}
                      role="img"
                      aria-label={`${family} ${step}: ${value}`}
                      title={value}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
