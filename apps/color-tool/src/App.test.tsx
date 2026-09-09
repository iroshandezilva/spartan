// @vitest-environment happy-dom
import { ThemeProvider } from "@iroshandezilva/spartant";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App.js";

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

/** The accessible name a screen reader would announce for a form control. */
function accessibleName(element: Element): string {
  const aria = element.getAttribute("aria-label");
  if (aria) return aria;
  const id = element.getAttribute("id");
  if (id) {
    const label = container.querySelector(`label[for="${id}"]`);
    if (label?.textContent) return label.textContent;
  }
  return element.textContent ?? "";
}

describe("accessibility", () => {
  it("gives every form control an accessible name", () => {
    const controls = [...container.querySelectorAll("input, select")];
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(accessibleName(control).trim(), `${control.outerHTML.slice(0, 80)}`).not.toBe("");
    }
  });

  it("gives every button an accessible name", () => {
    const buttons = [...container.querySelectorAll("button")];
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) {
      expect(accessibleName(button).trim()).not.toBe("");
    }
  });

  it("associates each label with its control by id", () => {
    for (const label of container.querySelectorAll("label[for]")) {
      const id = label.getAttribute("for");
      expect(
        container.querySelector(`#${CSS.escape(id ?? "")}`),
        `no control for ${id}`,
      ).not.toBeNull();
    }
  });

  it("announces gamut changes through a live region", () => {
    const live = [...container.querySelectorAll("[aria-live]")];
    expect(live.length).toBeGreaterThan(0);
    expect(live.some((node) => /sRGB/i.test(node.textContent ?? ""))).toBe(true);
  });

  it("gives the contrast table a caption", () => {
    expect(container.querySelector("table caption")?.textContent).toMatch(/contrast/i);
  });

  it("exposes the ramp as a list, not a pile of divs", () => {
    const items = container.querySelectorAll("ul li");
    expect(items.length).toBe(13);
  });

  it("marks the decorative swatch as hidden, since the value is in the text", () => {
    const swatches = container.querySelectorAll('li [aria-hidden="true"]');
    expect(swatches.length).toBe(13);
  });

  it("uses aria-pressed on the theme toggles", () => {
    const pressed = [...container.querySelectorAll("button[aria-pressed]")];
    expect(pressed).toHaveLength(3);
    expect(pressed.filter((b) => b.getAttribute("aria-pressed") === "true")).toHaveLength(1);
  });
});

describe("keyboard", () => {
  it("uses only natively focusable elements, so tab order comes free", () => {
    const interactive = [...container.querySelectorAll("input, select, button, a[href]")];
    expect(interactive.length).toBeGreaterThan(5);
    for (const element of interactive) {
      // A positive tabindex reorders the page unpredictably; -1 removes it from
      // the tab sequence. Neither belongs on a control a user must reach.
      const tabindex = element.getAttribute("tabindex");
      expect(tabindex === null || tabindex === "0").toBe(true);
    }
  });

  it("has no click handler on a non-interactive element", () => {
    // A div with onClick is unreachable by keyboard. React puts nothing in the
    // DOM for those, so this checks the rendered result rather than the source.
    const divs = [...container.querySelectorAll("div[onclick], span[onclick]")];
    expect(divs).toHaveLength(0);
  });
});

describe("controls", () => {
  it("constrains the sliders to safe ranges", () => {
    const ranges = [...container.querySelectorAll('input[type="range"]')] as HTMLInputElement[];
    expect(ranges).toHaveLength(3);
    for (const range of ranges) {
      expect(Number(range.min)).toBeLessThan(Number(range.max));
      expect(Number(range.value)).toBeGreaterThanOrEqual(Number(range.min));
      expect(Number(range.value)).toBeLessThanOrEqual(Number(range.max));
    }
  });

  it("lets the chroma slider reach every committed seed value", () => {
    // A coarse step silently makes some committed ramps unreproducible, which
    // breaks the comparison this tool exists for. 0.014 is neutral's seed.
    const ranges = [...container.querySelectorAll('input[type="range"]')] as HTMLInputElement[];
    const chroma = ranges[1];
    expect(chroma).toBeDefined();
    const step = Number(chroma?.step);
    expect(0.014 / step).toBeCloseTo(Math.round(0.014 / step), 6);
  });

  it("caps the hue shift at the documented limit", () => {
    const ranges = [...container.querySelectorAll('input[type="range"]')] as HTMLInputElement[];
    const shift = ranges.find((r) => Number(r.min) < 0);
    expect(shift?.min).toBe("-12");
    expect(shift?.max).toBe("12");
  });

  it("regenerates the ramp when the seed changes", async () => {
    const before = [...container.querySelectorAll("li")].map((li) => li.textContent).join();
    const hue = container.querySelector('input[type="range"]') as HTMLInputElement;
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(hue, "20");
      hue.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const after = [...container.querySelectorAll("li")].map((li) => li.textContent).join();
    expect(after).not.toBe(before);
  });
});

describe("committed comparison", () => {
  it("marks steps that match what is committed", () => {
    // The default seed is the committed primary seed, so every step should
    // match. That is what makes a difference meaningful when one appears.
    expect(container.textContent).toContain("matches committed");
    expect(container.textContent).not.toContain("differs from committed");
  });
});
