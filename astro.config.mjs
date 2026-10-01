// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://jose-villa.dev',
  // Sub-path when hosted on GitHub Pages (BASE_PATH=/jose-villa-site); root elsewhere.
  base: process.env.BASE_PATH || '/',
  output: 'static',
  integrations: [sitemap()],
});
