"use client";

import { cn } from "@iroshandezilva/spartant";
import type { ThemeSwitchProps } from "fumadocs-ui/layouts/shared/slots/theme-switch";
import { useTheme } from "fumadocs-ui/provider/base";
import type { ReactNode } from "react";
import { useSyncExternalStore } from "react";

/**
 * The theme control, owned by this app and passed to Fumadocs UI through the
 * `themeSwitch` slot.
 *
 * It replaces the stock control for one reason: the stock control ran every
 * theme change inside `document.startViewTransition`. A second click while a
 * transition was still running aborted the first, which logged
 * `InvalidStateError: Transition was aborted` on every fast toggle, and a
 * click that landed during the transition's snapshot could be dropped, because
 * the document does not receive input while a view transition captures it
 * (recorded by HAUX-54 and HAUX-55). Here the theme changes on the click, and
 * the change is painted by the same `data-theme` and `class` switch the rest
 * of the site keys off. Colour transitions, if any, belong to the stylesheet.
 *
 * Accessibility follows the toggle-button pattern rather than a label that
 * changes: the name stays "Dark theme" and `aria-pressed` carries the state,
 * so a screen reader announces both what the control is and where it sits.
 * The state is known only after hydration, because the theme lives in the
 * DOM and in storage rather than in server-rendered markup; until then the
 * control renders unpressed and gains its state on mount without a
 * hydration warning.
 */

const buttonClass =
  "inline-flex h-[var(--spartant-size-min-target)] w-[var(--spartant-size-min-target)] shrink-0 items-center justify-center rounded-control text-foreground-muted hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus-ring aria-pressed:text-foreground [&_svg]:size-4";

const subscribeToNothing = () => () => {};

/** True after hydration, false during server rendering and the hydrating render. */
function useMounted(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

function Sun() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function Moon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function Monitor() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

const themes: ReadonlyArray<{
  value: "light" | "dark" | "system";
  label: string;
  icon: ReactNode;
}> = [
  { value: "light", label: "Light theme", icon: <Sun /> },
  { value: "dark", label: "Dark theme", icon: <Moon /> },
  { value: "system", label: "Follow the system theme", icon: <Monitor /> },
];

/* Only the two props Fumadocs UI passes are read. The rest of
 * `ThemeSwitchProps` is `div` attributes, which do not belong on a
 * `fieldset` or a `button`. */
export function ThemeSwitch({ mode = "light-dark", className }: ThemeSwitchProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();

  if (mode === "light-dark") {
    const dark = mounted && resolvedTheme === "dark";
    return (
      <button
        type="button"
        aria-pressed={dark}
        aria-label="Dark theme"
        data-theme-toggle=""
        onClick={() => setTheme(dark ? "light" : "dark")}
        className={cn(buttonClass, className)}
      >
        {dark ? <Moon /> : <Sun />}
      </button>
    );
  }

  const current = mounted ? theme : undefined;
  return (
    <fieldset
      data-theme-toggle=""
      className={cn("inline-flex items-center border-0 p-0", className)}
    >
      <legend className="sr-only">Theme</legend>
      {themes.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={current === option.value}
          aria-label={option.label}
          onClick={() => setTheme(option.value)}
          className={buttonClass}
        >
          {option.icon}
        </button>
      ))}
    </fieldset>
  );
}
