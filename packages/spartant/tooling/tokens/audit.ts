/**
 * The colour audit: contrast, gamut, and the exception register.
 *
 * Written as a pure function over supplied themes rather than reading the
 * repository directly, so a controlled failing fixture can be passed in and the
 * failure path is exercised for real rather than assumed.
 *
 * Drift is a separate gate. `tokens:check` owns it, because drift is about the
 * generated files rather than about colour.
 */

import {
  type ContrastException,
  describeFailure,
  evaluatePairing,
  type Pairing,
} from "../color/contrast.js";
import { formatOklch, isInSrgbGamut, type Oklch } from "../color/oklch.js";

export type ThemeRoles = Map<string, Oklch>;

export interface AuditInput {
  themes: Record<string, ThemeRoles>;
  pairings: Pairing[];
  exceptions: ContrastException[];
}

export interface Finding {
  kind: "contrast" | "gamut" | "missing-role";
  theme: string;
  message: string;
}

export interface AuditReport {
  findings: Finding[];
  /** Pairings that passed only because an exception covers them. */
  waived: Array<{ theme: string; pairing: Pairing; exception: ContrastException }>;
  checked: number;
}

export function auditColors({ themes, pairings, exceptions }: AuditInput): AuditReport {
  const findings: Finding[] = [];
  const waived: AuditReport["waived"] = [];
  let checked = 0;

  for (const [theme, roles] of Object.entries(themes)) {
    // Gamut: every role must be displayable. The generator maps into sRGB, so
    // anything failing here got past the pipeline and would render clipped.
    for (const [path, color] of roles) {
      if (!isInSrgbGamut(color)) {
        findings.push({
          kind: "gamut",
          theme,
          message: [
            `${path} is outside sRGB`,
            `  value ${formatOklch(color)}`,
            "  the policy is to reduce chroma, holding lightness and hue",
            "  regenerate with `pnpm tokens:build`, or lower the seed chroma",
          ].join("\n"),
        });
      }
    }

    for (const pairing of pairings) {
      const foreground = roles.get(pairing.foreground);
      const background = roles.get(pairing.background);
      if (!foreground || !background) {
        findings.push({
          kind: "missing-role",
          theme,
          message: `${!foreground ? pairing.foreground : pairing.background} is required by a pairing but not defined in this theme`,
        });
        continue;
      }
      checked += 1;
      const result = evaluatePairing(pairing, foreground, background, exceptions);
      if (result.exception) {
        waived.push({ theme, pairing, exception: result.exception });
      } else if (!result.passes) {
        findings.push({ kind: "contrast", theme, message: describeFailure(result) });
      }
    }
  }

  return { findings, waived, checked };
}

/** Renders the report the way the CLI prints it. */
export function formatReport(report: AuditReport): string {
  const lines: string[] = [];

  if (report.waived.length > 0) {
    lines.push(`${report.waived.length} reviewed exception(s) in effect:`);
    for (const { theme, pairing, exception } of report.waived) {
      lines.push(
        `  [${theme}] ${pairing.foreground} on ${pairing.background}`,
        `    accepted ${exception.accepted}:1, approved in ${exception.approvedIn}`,
        `    ${exception.reason}`,
      );
    }
    lines.push("");
  }

  if (report.findings.length === 0) {
    lines.push(`${report.checked} pairings checked. No findings.`);
    return lines.join("\n");
  }

  const byKind = { contrast: 0, gamut: 0, "missing-role": 0 };
  for (const finding of report.findings) byKind[finding.kind] += 1;

  lines.push(
    `${report.findings.length} finding(s): ` +
      `${byKind.contrast} contrast, ${byKind.gamut} gamut, ${byKind["missing-role"]} missing role.`,
    "",
  );
  for (const finding of report.findings) {
    lines.push(`[${finding.theme}] ${finding.kind}`);
    for (const line of finding.message.split("\n")) lines.push(`  ${line}`);
    lines.push("");
  }
  return lines.join("\n");
}
