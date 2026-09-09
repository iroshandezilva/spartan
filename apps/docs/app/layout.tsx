import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteDescription, siteName, siteUrl } from "@/lib/shared";
import "./global.css";

export const metadata: Metadata = {
  /* Makes every relative URL in metadata absolute: canonical links, Open Graph
   * URLs, and the sitemap. See `siteUrl` for where the origin comes from. */
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  openGraph: {
    type: "website",
    siteName,
    locale: "en",
    title: siteName,
    description: siteDescription,
    url: "/",
  },
  twitter: {
    card: "summary",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    /*
     * `suppressHydrationWarning` is required by the theme script: it writes the
     * theme onto this element before React hydrates, so the server markup and
     * the first client render legitimately differ on these attributes.
     */
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        {/*
         * The first focusable element on every page. Visually hidden until it
         * receives focus, then drawn over the navigation so a keyboard user
         * can jump past the sidebar to the article. Every layout gives its
         * main content `id="content"`.
         */}
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
        >
          Skip to content
        </a>
        {/*
         * Two attributes, one source of truth. Fumadocs UI keys its dark styles
         * off the `.dark` class, Spartant's tokens key off `data-theme`. Asking
         * next-themes for both means one control switches the whole page, and
         * neither system needs a copy of the other's palette.
         *
         * `hotKey: false` turns off the single-letter shortcut Fumadocs binds
         * to the theme. It ran the switch inside a view transition, which
         * rejects with `InvalidStateError` when interrupted and suppresses
         * input for its duration; the owned `ThemeSwitch` control is the one
         * way to change theme, and it is reachable by keyboard.
         */}
        <RootProvider
          theme={{
            attribute: ["class", "data-theme"],
            defaultTheme: "system",
            enableSystem: true,
            hotKey: false,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
