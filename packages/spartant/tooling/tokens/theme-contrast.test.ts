import { describe, expect, it } from "vitest";
import { describeFailure, evaluatePairing } from "../color/contrast.js";
import { CONTRAST_EXCEPTIONS, REQUIRED_PAIRINGS } from "./pairings.js";
import { resolveTheme, type ThemeName } from "./themes.js";

const themes: ThemeName[] = ["light", "dark"];

describe.each(themes)("%s theme", (theme) => {
  const roles = resolveTheme(theme);

  it("resolves every semantic colour role", () => {
    expect(roles.size).toBeGreaterThan(20);
  });

  it.each(REQUIRED_PAIRINGS.map((p) => [`${p.foreground} on ${p.background}`, p] as const))(
    "%s meets the policy",
    (_label, pairing) => {
      const foreground = roles.get(pairing.foreground);
      const background = roles.get(pairing.background);
      if (!foreground) throw new Error(`Missing role ${pairing.foreground} in ${theme}`);
      if (!background) throw new Error(`Missing role ${pairing.background} in ${theme}`);

      const result = evaluatePairing(pairing, foreground, background, CONTRAST_EXCEPTIONS);
      if (!result.passes) throw new Error(`${theme}\n${describeFailure(result)}`);
      expect(result.passes).toBe(true);
    },
  );
});

describe.each(themes)("%s interactive states", (theme) => {
  const roles = resolveTheme(theme);
  const get = (path: string) => {
    const found = roles.get(path);
    if (!found) throw new Error(`Missing role ${path}`);
    return found;
  };

  it.each(["primary", "secondary"])("%s hover and active differ from the resting state", (role) => {
    const base = get(`color.${role}.default`);
    const hover = get(`color.${role}.hover`);
    const active = get(`color.${role}.active`);
    // Distinguishable means a visible lightness move, not merely a different
    // object. 0.02 in OKLCH lightness is about the smallest reliable step.
    expect(Math.abs(base.l - hover.l)).toBeGreaterThanOrEqual(0.02);
    expect(Math.abs(hover.l - active.l)).toBeGreaterThanOrEqual(0.02);
  });

  it("selected surface is distinguishable from the plain surface", () => {
    const surface = get("color.surface.default");
    const selected = get("color.surface.selected");
    expect(Math.abs(surface.l - selected.l)).toBeGreaterThanOrEqual(0.02);
  });

  it("disabled surface is distinguishable from the plain surface", () => {
    const surface = get("color.surface.default");
    const disabled = get("color.surface.disabled");
    expect(Math.abs(surface.l - disabled.l)).toBeGreaterThanOrEqual(0.02);
  });

  it("elevation separates the way the theme can afford", () => {
    const surface = get("color.surface.default");
    const elevated = get("color.surface.elevated");
    if (theme === "dark") {
      // Dark has headroom above the surface, so elevation is carried by
      // lightness and must actually move.
      expect(elevated.l).toBeGreaterThan(surface.l + 0.02);
    } else {
      // Light cannot go above white. Elevation is carried by shadow instead,
      // which is why `elevation.overlay` exists. Asserting equality keeps that
      // a stated decision: if the light surface ever stops being pure white,
      // this fails and the choice gets revisited rather than drifting.
      expect(elevated.l).toBe(surface.l);
    }
  });
});

describe("pairing metadata", () => {
  it("every pairsWith on a token is covered by a required pairing", async () => {
    const { readFileSync, readdirSync, statSync } = await import("node:fs");
    const { join } = await import("node:path");

    const files = (dir: string): string[] =>
      readdirSync(dir).flatMap((entry) => {
        const full = join(dir, entry);
        return statSync(full).isDirectory()
          ? files(full)
          : entry.endsWith(".tokens.json")
            ? [full]
            : [];
      });

    const declared: Array<[string, string]> = [];
    const visit = (node: Record<string, unknown>, path: string[] = []) => {
      for (const [key, value] of Object.entries(node)) {
        if (key.startsWith("$") || value === null || typeof value !== "object") continue;
        const record = value as Record<string, unknown>;
        if ("$value" in record) {
          const ext = record.$extensions as Record<string, Record<string, string>> | undefined;
          const pairsWith = ext?.["com.spartant"]?.pairsWith;
          if (pairsWith) declared.push([[...path, key].join("."), pairsWith]);
        } else {
          visit(record, [...path, key]);
        }
      }
    };
    for (const file of files("packages/spartant/src/tokens")) {
      visit(JSON.parse(readFileSync(file, "utf8")));
    }

    // Inline metadata is convenient on the token, but a second copy of the
    // truth is a second thing to drift. This asserts they agree.
    expect(declared.length).toBeGreaterThan(0);
    for (const [token, background] of declared) {
      const covered = REQUIRED_PAIRINGS.some(
        (p) => p.foreground === token && p.background === background,
      );
      expect(
        covered,
        `${token} declares pairsWith ${background}, which is not a required pairing`,
      ).toBe(true);
    }
  });
});
