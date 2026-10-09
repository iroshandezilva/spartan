import { RootProvider } from 'fumadocs-ui/provider/next';
import { IBM_Plex_Mono, Inter } from 'next/font/google';
import './global.css';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono', display: 'swap' });

export const metadata = {
  title: { default: 'Spartan Design System', template: '%s | Spartan Design System' },
  description: 'Usage documentation for the Spartan Lit components, design tokens, and Storybook playground.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <body>
        {/* The theme toggle writes the Spartan color scheme attribute, so every --sp-color-* token follows it. */}
        <RootProvider theme={{ attribute: 'data-sp-mode-color-scheme', defaultTheme: 'system', value: { light: 'Light', dark: 'Dark' } }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
