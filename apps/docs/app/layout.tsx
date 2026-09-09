import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { siteDescription, siteName } from "@/lib/shared";
import "./global.css";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
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
         * Two attributes, one source of truth. Fumadocs UI keys its dark styles
         * off the `.dark` class, Spartant's tokens key off `data-theme`. Asking
         * next-themes for both means one control switches the whole page, and
         * neither system needs a copy of the other's palette.
         */}
        <RootProvider
          theme={{
            attribute: ["class", "data-theme"],
            defaultTheme: "system",
            enableSystem: true,
          }}
        >
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
