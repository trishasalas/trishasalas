import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://trishasalas.com',
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
