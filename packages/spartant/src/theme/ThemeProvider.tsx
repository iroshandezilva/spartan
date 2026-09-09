import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  applyTheme,
  getSystemTheme,
  type ResolvedTheme,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
  watchSystemTheme,
  writeStoredTheme,
} from "./theme.js";

export interface ThemeContextValue {
  /** What the user chose, including `system`. */
  theme: ThemePreference;
  /** What is on screen. `system` resolved to `light` or `dark`. */
  resolvedTheme: ResolvedTheme;
  setTheme: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /** Used until a stored preference is found. Defaults to `system`. */
  defaultTheme?: ThemePreference;
  /** localStorage key. Change it only to avoid a collision. */
  storageKey?: string;
}

/**
 * Subscribes to the browser preference.
 *
 * `useSyncExternalStore` rather than an effect: the server snapshot is fixed at
 * `light`, so the first client render matches the server and hydration does not
 * warn. The real value arrives on subscribe, after hydration.
 */
function useSystemTheme(): ResolvedTheme {
  return useSyncExternalStore(
    useCallback((notify: () => void) => watchSystemTheme(notify), []),
    getSystemTheme,
    () => "light",
  );
}

/**
 * Applies light, dark, or system, and keeps the choice.
 *
 * The provider does not render a wrapper element. It writes `data-theme` on the
 * document root, so themes apply without any component's markup changing.
 *
 * For server-rendered apps, inline `themeScript()` in `<head>` as well. The
 * provider cannot prevent a flash on its own, because it only runs once React
 * has hydrated.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  // Starts from the default on both server and client so the first render
  // matches. The stored value is read in an effect, after hydration.
  const [theme, setThemeState] = useState<ThemePreference>(defaultTheme);
  const systemTheme = useSystemTheme();

  useEffect(() => {
    const stored = readStoredTheme(storageKey);
    if (stored) setThemeState(stored);
  }, [storageKey]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback(
    (preference: ThemePreference) => {
      setThemeState(preference);
      writeStoredTheme(preference, storageKey);
    },
    [storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme: theme === "system" ? systemTheme : resolveTheme(theme),
      setTheme,
    }),
    [theme, systemTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Reads and sets the theme. Throws outside a `ThemeProvider`, on purpose. */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }
  return value;
}
