import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { renderCSSV2 } from '../lib/figma-tokens';

const source = JSON.parse(await readFile('tokens/source.json', 'utf8'));
await mkdir('public', { recursive: true });
await writeFile('public/tokens.css', renderCSSV2(source));
console.log('Generated public/tokens.css from tokens/source.json');
