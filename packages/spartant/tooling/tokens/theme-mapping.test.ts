/**
 * Every semantic role a component can style with must reach Tailwind.
 *
 * This exists because the same defect has now shipped three times, and it is
 * silent every time. A token is added, the stylesheet's `@theme inline` block
 * is not updated, and the utility that reads it simply does not exist. Nothing
 * errors. Tailwind emits no rule, the element keeps its inherited value, and
 * the result looks close enough to correct to survive review:
 *
 * - `duration-press` fell back to Tailwind's default 150ms instead of the
 *   token's 120ms, because the durations were mapped into `--duration-*` and
 *   Tailwind reads `--transition-duration-*`.
 * - `hover:bg-danger-hover` and `active:bg-danger-active` generated nothing, so
 *   the destructive button had no hover or press colour at all.
 * - `text-danger-text` generated nothing, so a validation error rendered in the
 *   default foreground rather than the danger role.
 *
 * Each was found by measuring a rendered component, which is not a reliable way
 * to find them. This is.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(import.meta.dirname, "../..");
const THEME_CSS = resolve(ROOT, "src/styles/theme.css");
const TOKENS = resolve(ROOT, "src/tokens/generated/tokens.json");

/**
 * Roles deliberately not exposed as a Tailwind utility, and why.
 *
 * Every entry needs a reason. An unexplained exemption is how the check stops
 * meaning anything, so a second test fails a blank one.
 */
const NOT_MAPPED: Record<string, string> = {
  "duration.reduced": "the collapsed value, only ever read by the reduced-motion rule",
  "duration.indicator-loop":
    "an animation duration, applied with var() because Tailwind's duration-* is transition-only",
  "scale.press": "applied with var() in an arbitrary value; Tailwind has no scale theme namespace",
  "scale.overlay-enter": "as scale.press",
  "scale.reduced": "the collapsed value",
  "distance.indicator": "spatial offsets are applied with var(); no matching Tailwind namespace",
  "distance.state": "as distance.indicator",
  "distance.overlay": "as distance.indicator",
  "opacity.disabled": "components use the disabled colour roles rather than an opacity",
  "size.min-target":
    "a hit area applied with var() inside max(); Tailwind has no theme namespace that would give it a useful utility",
  "border-width.default":
    "Tailwind has no border-width theme namespace. Separator consumes it with var() in an arbitrary value, which does follow the token; the other components use `border`, which is 1px and happens to match and would not follow a change.",
  "border-width.emphasis": "as border-width.default, using `border-2`",
};

/** `color.foreground.muted` -> `--spartant-color-foreground-muted`. */
function customProperty(path: string): string {
  const segments = path.split(".").filter((segment) => segment !== "default");
  return `--spartant-${segments.join("-")}`;
}

function themeInlineBlock(): string {
  const css = readFileSync(THEME_CSS, "utf8");
  const start = css.indexOf("@theme inline {");
  expect(start).toBeGreaterThan(-1);

  let depth = 0;
  for (let index = css.indexOf("{", start); index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(start, index);
    }
  }
  throw new Error("Unterminated @theme inline block in theme.css");
}

const block = themeInlineBlock();
const semantic = (JSON.parse(readFileSync(TOKENS, "utf8")) as { semantic: Record<string, unknown> })
  .semantic;

describe("every semantic role reaches Tailwind", () => {
  const paths = Object.keys(semantic)
    // Springs are typed objects consumed from TypeScript, never CSS.
    .filter((path) => !path.startsWith("spring."))
    .sort();

  it("finds roles to check", () => {
    expect(paths.length).toBeGreaterThan(0);
  });

  it.each(paths)("%s is mapped, or exempt with a reason", (path) => {
    if (path in NOT_MAPPED) {
      expect(`${path}: ${NOT_MAPPED[path]}`.length).toBeGreaterThan(path.length + 2);
      return;
    }

    const property = customProperty(path);
    expect(
      block.includes(`var(${property})`)
        ? path
        : `${path} has no @theme inline mapping, so the utility that reads ${property} generates nothing`,
    ).toBe(path);
  });

  it("exempts only roles that exist", () => {
    // An exemption for a renamed token would silently stop covering anything.
    for (const path of Object.keys(NOT_MAPPED)) {
      expect(`${path}: ${path in semantic}`).toBe(`${path}: true`);
    }
  });
});
