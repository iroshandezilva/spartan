import { describe, expect, it } from "vitest";
import type { ContrastException, Pairing } from "../color/contrast.js";
import type { Oklch } from "../color/oklch.js";
import { auditColors, formatReport } from "./audit.js";
import { CONTRAST_EXCEPTIONS, REQUIRED_PAIRINGS } from "./pairings.js";
import { resolveTheme } from "./themes.js";

const pairing: Pairing = {
  foreground: "color.foreground.default",
  background: "color.background.default",
  kind: "body-text",
  reason: "primary reading text on the page",
};

const roles = (entries: Record<string, Oklch>) => new Map(Object.entries(entries));

const black: Oklch = { l: 0, c: 0, h: 0 };
const white: Oklch = { l: 1, c: 0, h: 0 };
const grey: Oklch = { l: 0.62, c: 0, h: 0 };
const impossible: Oklch = { l: 0.62, c: 0.4, h: 264 };

describe("passing fixture", () => {
  it("reports no findings when the pairing clears its threshold", () => {
    const report = auditColors({
      themes: {
        fixture: roles({
          "color.foreground.default": black,
          "color.background.default": white,
        }),
      },
      pairings: [pairing],
      exceptions: [],
    });
    expect(report.findings).toEqual([]);
    expect(report.checked).toBe(1);
    expect(formatReport(report)).toContain("No findings");
  });
});

describe("controlled failing fixtures", () => {
  it("catches a contrast failure and names everything needed to fix it", () => {
    const report = auditColors({
      themes: {
        fixture: roles({
          "color.foreground.default": grey,
          "color.background.default": white,
        }),
      },
      pairings: [pairing],
      exceptions: [],
    });
    expect(report.findings).toHaveLength(1);
    const [finding] = report.findings;
    expect(finding?.kind).toBe("contrast");

    const output = formatReport(report);
    expect(output).toContain("color.foreground.default on color.background.default");
    expect(output).toContain("needs 4.5:1");
    expect(output).toContain("body-text");
    expect(output).toMatch(/measured \d+(\.\d+)?:1/);
    expect(output).toContain("primary reading text on the page");
    expect(output).toContain("[fixture]");
  });

  it("catches a colour that no sRGB display can show", () => {
    const report = auditColors({
      themes: {
        fixture: roles({
          "color.foreground.default": black,
          "color.background.default": impossible,
        }),
      },
      pairings: [],
      exceptions: [],
    });
    expect(report.findings.map((f) => f.kind)).toEqual(["gamut"]);
    const output = formatReport(report);
    expect(output).toContain("color.background.default is outside sRGB");
    expect(output).toContain("reduce chroma");
    expect(output).toContain("pnpm tokens:build");
  });

  it("catches a pairing whose role the theme never defines", () => {
    const report = auditColors({
      themes: { fixture: roles({ "color.background.default": white }) },
      pairings: [pairing],
      exceptions: [],
    });
    expect(report.findings.map((f) => f.kind)).toEqual(["missing-role"]);
    expect(formatReport(report)).toContain("color.foreground.default is required by a pairing");
    // A missing role is never silently counted as checked.
    expect(report.checked).toBe(0);
  });

  it("counts findings per theme, so one bad theme does not hide behind a good one", () => {
    const report = auditColors({
      themes: {
        good: roles({ "color.foreground.default": black, "color.background.default": white }),
        bad: roles({ "color.foreground.default": grey, "color.background.default": white }),
      },
      pairings: [pairing],
      exceptions: [],
    });
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]?.theme).toBe("bad");
    expect(report.checked).toBe(2);
  });
});

describe("exceptions", () => {
  const exception: ContrastException = {
    foreground: pairing.foreground,
    background: pairing.background,
    accepted: 4.1,
    reason: "caption only, reviewed",
    approvedIn: "HAUX-37",
  };

  it("waives a failure and reports it rather than hiding it", () => {
    const report = auditColors({
      themes: {
        fixture: roles({
          "color.foreground.default": grey,
          "color.background.default": white,
        }),
      },
      pairings: [pairing],
      exceptions: [exception],
    });
    expect(report.findings).toEqual([]);
    expect(report.waived).toHaveLength(1);

    // Searchable: the waiver, its reason, and its approving issue are printed
    // even on a clean run.
    const output = formatReport(report);
    expect(output).toContain("1 reviewed exception(s) in effect");
    expect(output).toContain("approved in HAUX-37");
    expect(output).toContain("caption only, reviewed");
  });
});

describe("the real themes", () => {
  it("pass the audit with no findings and no exceptions", () => {
    const report = auditColors({
      themes: { light: resolveTheme("light"), dark: resolveTheme("dark") },
      pairings: REQUIRED_PAIRINGS,
      exceptions: CONTRAST_EXCEPTIONS,
    });
    expect(report.findings).toEqual([]);
    expect(report.waived).toEqual([]);
    expect(report.checked).toBe(REQUIRED_PAIRINGS.length * 2);
  });
});
