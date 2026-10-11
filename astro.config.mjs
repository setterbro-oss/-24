import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL || 'https://youth-rent-24.pages.dev',
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap()]
});
