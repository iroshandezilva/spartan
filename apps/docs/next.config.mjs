import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  /*
   * This app lives in a pnpm workspace and consumes the package through a
   * workspace link, so files it needs sit above its own directory. Without an
   * explicit root, Next infers one from the nearest lockfile and can pick the
   * wrong directory in a monorepo.
   */
  outputFileTracingRoot: new URL("../../", import.meta.url).pathname,
  turbopack: {
    root: new URL("../../", import.meta.url).pathname,
  },
};

export default withMDX(config);
