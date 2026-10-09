import { createMDX } from 'fumadocs-mdx/next';
import linearDocs from './lib/linear-docs.json' with { type: 'json' };

// Routes that used to redirect to Linear keep working. The docs home ('') is real content now.
const linearRedirects = Object.entries(linearDocs)
  .filter(([slug]) => slug !== '')
  .map(([slug, destination]) => ({ source: `/docs/${slug}`, destination, permanent: false }));

export default createMDX()({
  reactStrictMode: true,
  turbopack: { root: import.meta.dirname },
  redirects: async () => linearRedirects,
  // Storybook is served from the same origin under /storybook so the docs can embed it.
  headers: async () => [{ source: '/storybook/:path*', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] }],
});
