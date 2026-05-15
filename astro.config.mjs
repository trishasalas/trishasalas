import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://trishasalas.com',
  integrations: [sitemap()],
  experimental: {
    contentIntellisense: true,
  },
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  vite: {
    build: {
      sourcemap: true, // Enables both JS and CSS source maps
    },
    css: {
      devSourcemap: true, // Specifically ensures source maps for CSS in development
    }
  }
});
