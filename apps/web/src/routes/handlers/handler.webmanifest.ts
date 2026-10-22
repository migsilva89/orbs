import { env } from '@repo/env/client';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/img/favicon/site.webmanifest')({
  server: {
    handlers: {
      GET: () => Response.json({
        name: env.VITE_APP_NAME,
        short_name: env.VITE_APP_NAME,
        id: '/',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/img/favicon/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/img/favicon/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
      }, { headers: { 'content-type': 'application/manifest+json' } }),
    },
  },
});
