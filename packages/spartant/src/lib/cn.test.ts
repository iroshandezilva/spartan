/**
 * `cn` must not discard a class it was never asked to choose between.
 *
 * tailwind-merge only removes a class when it believes a later one conflicts,
 * and it decides that from the class name alone. Given a theme it does not know,
 * it guesses, and a wrong guess merges two independent groups into one and
 * silently deletes the earlier class.
 *
 * That is not a hypothetical either. Before `cn` was given the theme, every
 * Button lost `text-primary-foreground` to `text-body`, and Badge lost
 * `text-caption` to `text-foreground`. Both produced a component that rendered,
 * passed type checking, passed axe, and was the wrong colour or the wrong size.
 *
 * Two things are checked here, and the second is the one that keeps working
 * next year: that the merge preserves independent classes, and that the theme
 * `cn` was given still matches the stylesheet it came from.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { cn, MERGE_THEME } from "./cn.js";

const THEME_CSS = readFileSync(resolve(import.meta.dirname, "../styles/theme.css"), "utf8");

/**
 * Namespace-to-prefix map for reading the stylesheet back.
 *
 * `@theme inline` declares a font size as `--text-body` and a colour as
 * `--color-primary`, which is the same source tailwind-merge's `theme` option
 * describes, so the two can be compared directly.
 */
const NAMESPACE_PREFIX = {
  text: "--text-",
  color: "--color-",
  radius: "--radius-",
  shadow: "--shadow-",
  leading: "--leading-",
  tracking: "--tracking-",
  spacing: "--spacing-",
} as const;

/** Every custom property under one namespace, as declared in `theme.css`. */
function declaredIn(prefix: string): string[] {
  const names = new Set<string>();
  for (const line of THEME_CSS.split("\n")) {
    const match = line.match(new RegExp(`^\\s+${prefix}([a-z0-9-]+):`));
    if (match?.[1]) names.add(match[1]);
  }
  return [...names].sort();
}

describe("cn keeps a font size and a text colour apart", () => {
  it("keeps both when a component sets a size and a colour", () => {
    const merged = cn("text-caption", "text-foreground");
    expect(merged).toContain("text-caption");
    expect(merged).toContain("text-foreground");
  });

  it("keeps every font size against every text colour", () => {
    for (const size of MERGE_THEME.text) {
      for (const color of ["foreground", "primary-foreground", "danger-text"]) {
        const merged = cn(`text-${color}`, `text-${size}`);
        expect(merged, `text-${color} + text-${size}`).toContain(`text-${color}`);
        expect(merged, `text-${color} + text-${size}`).toContain(`text-${size}`);
      }
    }
  });

  /**
   * The other half of the contract. A merger that never removes anything would
   * pass every test above and break `className` as an override, which is the
   * reason `cn` exists at all.
   */
  it("still lets a later class win within one group", () => {
    expect(cn("text-body", "text-caption")).toBe("text-caption");
    expect(cn("text-foreground", "text-primary")).toBe("text-primary");
    expect(cn("bg-primary", "bg-danger")).toBe("bg-danger");
    expect(cn("rounded-control", "rounded-pill")).toBe("rounded-pill");
  });
});

describe("the theme cn was given matches the stylesheet", () => {
  // `ease` is absent: `theme.css` maps only three easing roles into Tailwind's
  // namespace while `easing.state` and `easing.progress` are consumed through
  // arbitrary values, so the two lists are legitimately different lengths and a
  // direct comparison would fail on correct code.
  const comparable = Object.entries(NAMESPACE_PREFIX) as [keyof typeof NAMESPACE_PREFIX, string][];

  it.each(comparable)("every %s role in theme.css is known to cn", (namespace, prefix) => {
    const declared = declaredIn(prefix);
    expect(
      declared.length,
      `no ${namespace} roles found; the prefix may have changed`,
    ).toBeGreaterThan(0);

    const known = new Set<string>(MERGE_THEME[namespace]);
    const missing = declared.filter((name) => !known.has(name));
    expect(missing).toEqual([]);
  });
});
