import { createMDX } from 'fumadocs-mdx/next';
export default createMDX()({ reactStrictMode: true, turbopack: { root: import.meta.dirname } });
