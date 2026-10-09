import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
export const metadata = { title: { default: 'Spartant Lab', template: '%s | Spartant Lab' }, description: 'The working record for the Spartant Lit experiment.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en" suppressHydrationWarning><body><RootProvider theme={{ defaultTheme: 'light' }}>{children}</RootProvider></body></html>;
}
