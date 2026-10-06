// Writes feed/providers.json from the built-in provider data (src/data/providers.ts).
// Run with: pnpm feed:build   (needs Node 22.6+ for --experimental-strip-types)
import { writeFileSync } from 'node:fs';
import { PROVIDERS } from '../src/data/providers.ts';

const today = new Date().toISOString().slice(0, 10);
const feed = { schema: 1, updated: today, providers: PROVIDERS };
writeFileSync(new URL('../feed/providers.json', import.meta.url), JSON.stringify(feed, null, 2) + '\n');
console.log(`Wrote feed/providers.json with ${PROVIDERS.length} providers (updated ${today}).`);
