import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
export const metadata = { title: { default: 'Spartan Design System', template: '%s | Spartan Design System' }, description: 'Lit components, design tokens, Storybook, and Figma sync for the Spartan Design System.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><RootProvider theme={{ defaultTheme: 'light' }}>{children}</RootProvider></body></html>;
}
