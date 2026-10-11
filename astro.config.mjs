import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import regions from './src/data/regions.json' with { type: 'json' };

const unverifiedPaths = new Set(
  regions.filter((region) => region.verificationStatus !== 'verified')
    .map((region) => `/${region.slug}/`)
);
const hasVerifiedRegion = regions.some((region) => region.verificationStatus === 'verified');

export default defineConfig({
  site: process.env.SITE_URL || 'https://youth-rent-24.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    sitemap({
      filter: (page) => {
        const url = new URL(page);
        if (!hasVerifiedRegion && url.pathname === '/') return false;
        return ![...unverifiedPaths].some((path) => url.pathname === path);
      }
    })
  ]
});
