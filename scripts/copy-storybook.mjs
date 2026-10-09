// Copies the static Storybook build into public/storybook so the docs site serves it at /storybook.
import { cp, rm, access } from 'node:fs/promises';

const from = new URL('../packages/components/storybook-static', import.meta.url);
const to = new URL('../public/storybook', import.meta.url);
await access(from).catch(() => {
  console.error('packages/components/storybook-static is missing. Run `pnpm storybook:build` first.');
  process.exit(1);
});
await rm(to, { recursive: true, force: true });
await cp(from, to, { recursive: true });
console.log('Copied Storybook to public/storybook');
