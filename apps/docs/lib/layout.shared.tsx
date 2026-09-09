import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { docsRoute, siteName } from "./shared";

/** Options shared by the home shell and the docs shell, so the two never drift
 * apart on branding or top-level navigation. */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: siteName,
    },
    links: [
      {
        text: "Documentation",
        url: docsRoute,
        active: "nested-url",
      },
    ],
  };
}
