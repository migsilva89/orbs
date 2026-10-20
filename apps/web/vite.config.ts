import { env } from '@openbots/env/server';
import tailwindcss from '@tailwindcss/vite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { createI18nPlugin } from './vite/i18n.vite.ts';
import { createIconsPlugin } from './vite/icons.vite.ts';
import { createMarkdownPlugin } from './vite/markdown.vite.ts';
import { createReactPlugins } from './vite/react.vite.ts';
import { createTanstackStartPlugin } from './vite/tanstack-start.vite.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  clearScreen: false,
  server: {
    host: true,
    proxy: {
      '/rpc': { target: env.OPENBOTS_DAEMON_URL, ws: true },
      '/files': { target: env.OPENBOTS_DAEMON_URL },
    },
  },
  preview: {
    host: true,
  },
  plugins: [
    tailwindcss(),
    createTanstackStartPlugin(),
    createIconsPlugin(),
    createMarkdownPlugin(),
    createI18nPlugin(__dirname),
    ...createReactPlugins(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
});
