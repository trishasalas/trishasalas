import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://trishasalas.com',
  integrations: [sitemap()],
  experimental: {
    contentIntellisense: true,
  },
  vite: {
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          sourceMap: true,
        },
      },
    },
  },
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
