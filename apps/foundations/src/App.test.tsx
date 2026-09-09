// @vitest-environment happy-dom

import { readFileSync } from "node:fs";
import { ThemeProvider } from "@iroshandezilva/spartant";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App.js";
import { rolesIn } from "./tokens.js";

let container: HTMLDivElement;

beforeEach(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(
      <ThemeProvider>
        <App />
      </ThemeProvider>,
    );
  });
});

afterEach(() => {
  document.body.innerHTML = "";
  document.documentElement.removeAttribute("data-theme");
  localStorage.clear();
});

describe("coverage", () => {
  it("renders a specimen for every type role", () => {
    // happy-dom does no real layout, so this asserts the specimens exist and
    // reference the right variables. Judging how they look needs a browser.
    for (const [role] of rolesIn("font.size")) {
      expect(container.querySelector(`[data-testid="type-${role}"]`), role).not.toBeNull();
    }
  });

  it("renders every spacing role", () => {
    const roles = rolesIn("space");
    expect(roles.length).toBeGreaterThan(0);
    for (const [role] of roles) {
      expect(container.textContent).toContain(`space.${role}`);
    }
  });

  it("renders every radius role", () => {
    for (const [role] of rolesIn("radius")) {
      expect(container.textContent).toContain(role);
    }
  });

  it("shows both spring roles", () => {
    expect(container.textContent).toContain("state");
    expect(container.textContent).toContain("gesture");
    expect(container.textContent).toMatch(/stiffness 420/);
    expect(container.textContent).toMatch(/stiffness 260/);
  });
});

describe("the specimens use tokens, not raw values", () => {
  const source = [
    readFileSync("apps/foundations/src/App.tsx", "utf8"),
    readFileSync("apps/foundations/src/Motion.tsx", "utf8"),
  ].join("\n");

  it("never hardcodes a duration, size, or radius", () => {
    // A specimen that hardcoded a value would show something the package does
    // not ship, which defeats the point of a specimen.
    expect(source).not.toMatch(/\b\d+ms\b/);
    expect(source).not.toMatch(/fontSize:\s*"\d/);
    expect(source).not.toMatch(/borderRadius:\s*"\d/);
  });

  it("drives motion through the tokens, so the controls reach every demo", () => {
    for (const variable of [
      "--spartant-duration-press-feedback",
      "--spartant-duration-state-change",
      "--spartant-duration-overlay-enter",
      "--spartant-duration-overlay-exit",
      "--spartant-scale-press",
      "--spartant-scale-overlay-enter",
      "--spartant-distance-overlay",
    ]) {
      expect(source, variable).toContain(variable);
    }
  });
});

describe("motion controls", () => {
  it("offers slow motion and a reduced-motion simulation", () => {
    const labels = [...container.querySelectorAll("button[aria-pressed]")].map((b) =>
      b.textContent?.trim(),
    );
    expect(labels).toContain("Slow motion, 8x");
    expect(labels).toContain("Simulate reduced motion");
  });

  it("applies the override on the stage, which is how the demos inherit it", async () => {
    const stage = container.querySelector('[data-testid="motion-stage"]') as HTMLElement;
    expect(stage.getAttribute("style") ?? "").not.toContain("--spartant-duration");

    const reduced = [...container.querySelectorAll("button")].find(
      (b) => b.textContent?.trim() === "Simulate reduced motion",
    );
    await act(async () => {
      reduced?.click();
    });

    const after = container.querySelector('[data-testid="motion-stage"]') as HTMLElement;
    const style = after.getAttribute("style") ?? "";
    expect(style).toContain("--spartant-duration-press-feedback: 0ms");
    expect(style).toContain("--spartant-scale-press: 1");
    expect(style).toContain("--spartant-distance-overlay: 0px");
  });

  it("makes slow motion and reduced motion mutually exclusive", async () => {
    const button = (label: string) =>
      [...container.querySelectorAll("button")].find((b) => b.textContent?.trim() === label);

    await act(async () => button("Slow motion, 8x")?.click());
    expect(button("Slow motion, 8x")?.getAttribute("aria-pressed")).toBe("true");

    await act(async () => button("Simulate reduced motion")?.click());
    // Slowing motion and removing it are contradictory instructions.
    expect(button("Slow motion, 8x")?.getAttribute("aria-pressed")).toBe("false");
    expect(button("Simulate reduced motion")?.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("accessibility", () => {
  it("gives each section a heading it is labelled by", () => {
    const sections = [...container.querySelectorAll("section[aria-labelledby]")];
    expect(sections.length).toBeGreaterThanOrEqual(4);
    for (const section of sections) {
      const id = section.getAttribute("aria-labelledby");
      expect(container.querySelector(`#${CSS.escape(id ?? "")}`), id ?? undefined).not.toBeNull();
    }
  });

  it("marks purely decorative shapes as hidden", () => {
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(5);
  });

  it("exposes overlay state through aria-expanded", () => {
    const trigger = container.querySelector('[data-testid="overlay-trigger"]');
    expect(trigger?.getAttribute("aria-expanded")).toBe("false");
  });
});
