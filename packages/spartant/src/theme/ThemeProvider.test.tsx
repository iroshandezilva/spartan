// @vitest-environment happy-dom
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeProvider.js";
import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, themeScript } from "./theme.js";

function setSystemPreference(dark: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark && query.includes("dark"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Dark
      </button>
    </div>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("server rendering", () => {
  it("renders without a DOM", () => {
    const html = renderToString(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(html).toContain("system");
  });

  it("renders the same markup on the server whatever the browser prefers", () => {
    // The server cannot know the browser preference. If the first client render
    // disagreed with the server, React would warn and swap the markup, which is
    // the hydration mismatch this design exists to avoid.
    setSystemPreference(true);
    const dark = renderToString(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    setSystemPreference(false);
    const light = renderToString(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(dark).toBe(light);
  });
});

describe("hydration", () => {
  it("hydrates server markup without a mismatch, with dark stored", async () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    setSystemPreference(false);

    // What a real server-rendered page does: the blocking script sets the
    // attribute before paint, then React hydrates markup rendered without it.
    new Function(themeScript())();
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark");

    const html = renderToString(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    const errors: unknown[] = [];
    const spy = vi.spyOn(console, "error").mockImplementation((...args) => errors.push(args));

    await act(async () => {
      hydrateRoot(
        container,
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      );
    });

    spy.mockRestore();
    const mismatches = errors.filter((e) => JSON.stringify(e).match(/hydrat|did not match/i));
    expect(mismatches).toEqual([]);

    // After hydration the stored preference has been picked up.
    expect(container.querySelector('[data-testid="theme"]')?.textContent).toBe("dark");
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark");
  });
});

describe("switching", () => {
  it("applies a choice to the document and stores it", async () => {
    setSystemPreference(false);
    const container = document.createElement("div");
    document.body.appendChild(container);

    const { createRoot } = await import("react-dom/client");
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      );
    });

    expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(false);

    const button = container.querySelector("button");
    if (!button) throw new Error("no button");
    await act(async () => {
      button.click();
    });

    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(container.querySelector('[data-testid="resolved"]')?.textContent).toBe("dark");
  });

  it("the switcher is a real button, so keyboard and assistive tech get it free", async () => {
    setSystemPreference(false);
    const container = document.createElement("div");
    document.body.appendChild(container);
    const { createRoot } = await import("react-dom/client");
    await act(async () => {
      createRoot(container).render(
        <ThemeProvider>
          <Probe />
        </ThemeProvider>,
      );
    });
    const button = container.querySelector("button");
    expect(button?.tagName).toBe("BUTTON");
    expect(button?.getAttribute("type")).toBe("button");
  });
});

describe("misuse", () => {
  it("throws outside a provider rather than silently doing nothing", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderToString(<Probe />)).toThrow(/must be used inside a ThemeProvider/);
    spy.mockRestore();
  });
});
