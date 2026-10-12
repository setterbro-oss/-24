import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import national from '../src/data/national.json' with { type: 'json' };
import regions from '../src/data/regions.json' with { type: 'json' };
import { isGuideIndexable, isRegionIndexable, isHomeIndexable } from '../src/lib/indexing.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'public/_headers');
const marker = '# BEGIN GENERATED PUBLISH-GATE HEADERS';
const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
const base = existing.includes(marker) ? existing.slice(0, existing.indexOf(marker)).trimEnd() : existing.trimEnd();
const drafts = [];
if (!isHomeIndexable(national, regions)) drafts.push('/');
if (!isGuideIndexable(national)) drafts.push('/guide/');
for (const region of regions) if (!isRegionIndexable(region)) drafts.push(`/${region.slug}/`);
const generated = drafts.flatMap((route) => [
  `${route}\n  X-Robots-Tag: noindex, nofollow`,
  ...(route === '/' ? [] : [`${route}*\n  X-Robots-Tag: noindex, nofollow`]),
]).join('\n\n');
fs.writeFileSync(file, `${base}\n\n${marker}\n${generated}\n`, 'utf8');
console.log(`Generated X-Robots-Tag rules for ${drafts.length} draft/demoted route(s).`);
