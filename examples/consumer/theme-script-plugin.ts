import { themeScript } from "@iroshandezilva/spartant";
import type { Plugin } from "vite";

/**
 * Injects Spartant's blocking theme script into `<head>`.
 *
 * Injected rather than pasted into index.html. A pasted copy is a second copy
 * of the same logic, and it drifts: the first attempt at this was rewritten by
 * the formatter within minutes, silently breaking the byte-for-byte match with
 * the source.
 *
 * It is placed first in the head, so it runs before any stylesheet and before
 * the module that mounts React.
 */
export function spartantThemeScript(): Plugin {
  return {
    name: "spartant-theme-script",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          children: themeScript(),
          injectTo: "head-prepend",
        },
      ];
    },
  };
}
