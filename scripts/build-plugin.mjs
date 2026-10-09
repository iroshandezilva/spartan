import { build } from 'esbuild';
import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('plugin/dist', { recursive: true });
await build({ entryPoints: ['plugin/code.ts'], outfile: 'plugin/dist/code.js', bundle: true, format: 'iife', target: 'es2017' });
await copyFile('plugin/ui.html', 'plugin/dist/ui.html');
console.log('Built plugin/dist. Import plugin/manifest.json in Figma.');
