/**
 * CLI gate for the colour policy. Runs in `pnpm validate` and in CI.
 *
 * Checks contrast over every theme, gamut over every role, and prints any
 * reviewed exception so a waiver is visible rather than silent.
 */

import { auditColors, formatReport } from "./audit.js";
import { CONTRAST_EXCEPTIONS, REQUIRED_PAIRINGS } from "./pairings.js";
import { resolveTheme } from "./themes.js";

const report = auditColors({
  themes: { light: resolveTheme("light"), dark: resolveTheme("dark") },
  pairings: REQUIRED_PAIRINGS,
  exceptions: CONTRAST_EXCEPTIONS,
});

const output = formatReport(report);

if (report.findings.length > 0) {
  console.error(output);
  console.error("Fix the mapping, or record a reviewed exception in tooling/tokens/pairings.ts.");
  process.exit(1);
}

console.log(output);
