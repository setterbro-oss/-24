import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import regions from './src/data/regions.json' with { type: 'json' };
import national from './src/data/national.json' with { type: 'json' };
import { SITE_URL } from './src/lib/site.mjs';
import { isGuideIndexable, isRegionIndexable, isHomeIndexable } from './src/lib/indexing.mjs';

// sitemap에는 검색 노출을 허용한 페이지만 넣습니다. (noindex 페이지는 제외)
const sitemapPaths = new Set(['/about/', '/privacy/', '/contact/', '/editorial-policy/', '/corrections/']);
if (isHomeIndexable(national, regions)) sitemapPaths.add('/');
if (isGuideIndexable(national)) sitemapPaths.add('/guide/');
for (const region of regions) {
  if (isRegionIndexable(region)) sitemapPaths.add(`/${region.slug}/`);
}

export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => sitemapPaths.has(new URL(page).pathname),
    }),
  ],
});
