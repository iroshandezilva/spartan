/**
 * Theme application, without React.
 *
 * The DOM is the single source of truth: the `data-theme` attribute on the
 * root element decides what is shown. React state mirrors it rather than owning
 * it, which is what lets a blocking script set the theme before React exists
 * and before the first paint.
 */

/** What the user chose. `system` defers to the browser preference. */
export type ThemePreference = "light" | "dark" | "system";

/** What is actually on screen. `system` has been resolved by this point. */
export type ResolvedTheme = "light" | "dark";

/** Attribute the stylesheet keys off. Also the documented override point. */
export const THEME_ATTRIBUTE = "data-theme";

/** Default storage key. Namespaced so it cannot collide with a host app. */
export const THEME_STORAGE_KEY = "spartant-theme";

const PREFERENCES: readonly ThemePreference[] = ["light", "dark", "system"];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === "string" && PREFERENCES.includes(value as ThemePreference);
}

/** The browser preference, or `light` where it cannot be asked. */
export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "system" ? getSystemTheme() : preference;
}

/**
 * Writes the preference to the document.
 *
 * `system` removes the attribute rather than writing a resolved value, so the
 * stylesheet's `prefers-color-scheme` rule takes over. Writing `light` or
 * `dark` for `system` would freeze the choice and stop the page following the
 * browser when the user changes it mid-session.
 */
export function applyTheme(preference: ThemePreference, element?: Element): void {
  const target =
    element ?? (typeof document === "undefined" ? undefined : document.documentElement);
  if (!target) return;
  if (preference === "system") target.removeAttribute(THEME_ATTRIBUTE);
  else target.setAttribute(THEME_ATTRIBUTE, preference);
}

/** Reads the preference currently applied to the document. */
export function readAppliedTheme(element?: Element): ThemePreference {
  const target =
    element ?? (typeof document === "undefined" ? undefined : document.documentElement);
  const value = target?.getAttribute(THEME_ATTRIBUTE);
  return isThemePreference(value) && value !== "system" ? value : "system";
}

/** Reads a stored preference, tolerating unavailable or poisoned storage. */
export function readStoredTheme(storageKey: string = THEME_STORAGE_KEY): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(storageKey);
    return isThemePreference(value) ? value : null;
  } catch {
    // Private mode, blocked cookies, or a full quota. A theme is not worth
    // throwing over.
    return null;
  }
}

export function writeStoredTheme(
  preference: ThemePreference,
  storageKey: string = THEME_STORAGE_KEY,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    // Same reasoning. The theme still applies for this page view.
  }
}

/** Calls back when the browser preference changes. Returns an unsubscribe. */
export function watchSystemTheme(onChange: (theme: ResolvedTheme) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (event: MediaQueryListEvent) => onChange(event.matches ? "dark" : "light");
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}

/**
 * A blocking script for server-rendered apps.
 *
 * Inline this in `<head>`, before any stylesheet. It runs before first paint
 * and sets the attribute, so a user with dark selected never sees a flash of
 * the light theme. It touches only the DOM, so it cannot disagree with the
 * markup React is about to hydrate.
 *
 * @example
 * ```tsx
 * <head>
 *   <script dangerouslySetInnerHTML={{ __html: themeScript() }} />
 * </head>
 * ```
 */
export function themeScript(storageKey: string = THEME_STORAGE_KEY): string {
  return `(function(){try{var t=localStorage.getItem(${JSON.stringify(storageKey)});if(t==="light"||t==="dark"){document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t)}}catch(e){}})();`;
}
