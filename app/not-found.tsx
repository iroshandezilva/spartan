import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ maxWidth: 560, margin: '20vh auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 600 }}>Page not found</h1>
      <p style={{ margin: '12px 0 20px', color: 'var(--sp-color-foreground-muted)' }}>This page is not in the Spartan documentation. Try the search, or start from the docs home.</p>
      <Link href="/docs" style={{ color: 'var(--sp-color-primary-text)', textDecoration: 'underline' }}>Go to the docs home</Link>
    </main>
  );
}
