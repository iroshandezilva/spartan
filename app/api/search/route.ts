import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

// Static index of the published docs pages, served to the Fumadocs search dialog.
export const { GET } = createFromSource(source);
