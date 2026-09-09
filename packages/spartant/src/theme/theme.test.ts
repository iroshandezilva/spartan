// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyTheme,
  getSystemTheme,
  isThemePreference,
  readAppliedTheme,
  readStoredTheme,
  resolveTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
  themeScript,
  writeStoredTheme,
} from "./theme.js";

/** Stands in for the browser preference. */
function setSystemPreference(dark: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: dark && query.includes("dark"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  // Unstub before touching storage: some tests replace localStorage with an
  // object that throws, and clearing through that stub fails the teardown
  // rather than the test.
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute(THEME_ATTRIBUTE);
  localStorage.clear();
});

describe("applying a theme", () => {
  it("writes the attribute for an explicit choice", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("light");
  });

  it("removes the attribute for system rather than freezing a resolved value", () => {
    // Writing "dark" for system would stop the page following the browser when
    // the user changes their preference mid-session.
    applyTheme("dark");
    applyTheme("system");
    expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(false);
  });

  it("round-trips through the document", () => {
    applyTheme("dark");
    expect(readAppliedTheme()).toBe("dark");
    applyTheme("system");
    expect(readAppliedTheme()).toBe("system");
  });
});

describe("system preference", () => {
  it("is deterministic in both directions", () => {
    setSystemPreference(true);
    expect(getSystemTheme()).toBe("dark");
    setSystemPreference(false);
    expect(getSystemTheme()).toBe("light");
  });

  it("falls back to light where it cannot be asked", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(getSystemTheme()).toBe("light");
  });

  it("resolves an explicit choice without consulting the browser", () => {
    setSystemPreference(true);
    expect(resolveTheme("light")).toBe("light");
    expect(resolveTheme("system")).toBe("dark");
  });
});

describe("storage", () => {
  it("round-trips a preference", () => {
    writeStoredTheme("dark");
    expect(readStoredTheme()).toBe("dark");
  });

  it("ignores a value that is not a theme", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "chartreuse");
    expect(readStoredTheme()).toBeNull();
  });

  it("survives storage that throws", () => {
    // Private mode and blocked cookies both do this. A theme is not worth
    // taking the page down for.
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("denied");
      },
      setItem() {
        throw new Error("denied");
      },
    });
    expect(readStoredTheme()).toBeNull();
    expect(() => writeStoredTheme("dark")).not.toThrow();
  });
});

describe("the blocking script", () => {
  it("applies a stored theme before paint", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    new Function(themeScript())();
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark");
  });

  it("leaves the attribute alone for system, so the media query wins", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    new Function(themeScript())();
    expect(document.documentElement.hasAttribute(THEME_ATTRIBUTE)).toBe(false);
  });

  it("does nothing when storage throws, rather than breaking the page", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("denied");
      },
    });
    expect(() => new Function(themeScript())()).not.toThrow();
  });

  it("escapes its storage key, so a key cannot inject script", () => {
    expect(themeScript('a"; alert(1); //')).toContain('"a\\"; alert(1); //"');
  });
});

describe("guards", () => {
  it("accepts only the three preferences", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("system")).toBe(true);
    expect(isThemePreference("solarized")).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});
