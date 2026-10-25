import type { TanstackFaviconLink, TanstackFaviconLinksParams } from './types/tanstack-favicon.types';

export function createFaviconLinks(params: TanstackFaviconLinksParams = {}): TanstackFaviconLink[] {
  const base = params.basePath ?? '/img/favicon';
  const color = params.themeColor ?? '#ffffff';

  return [
    { rel: 'icon', type: 'image/svg+xml', href: `${base}/favicon.svg` },
    { rel: 'icon', type: 'image/png', href: `${base}/favicon-96x96.png`, sizes: '96x96' },
    { rel: 'icon', type: 'image/png', href: `${base}/favicon-48x48.png`, sizes: '48x48' },
    { rel: 'icon', type: 'image/png', href: `${base}/favicon-32x32.png`, sizes: '32x32' },
    { rel: 'icon', type: 'image/png', href: `${base}/favicon-16x16.png`, sizes: '16x16' },
    { rel: 'shortcut icon', href: `${base}/favicon.ico` },
    { rel: 'apple-touch-icon', sizes: '180x180', href: `${base}/apple-touch-icon.png` },
    { rel: 'apple-touch-icon', sizes: '167x167', href: `${base}/apple-touch-icon-167x167.png` },
    { rel: 'apple-touch-icon', sizes: '152x152', href: `${base}/apple-touch-icon-152x152.png` },
    { rel: 'apple-touch-icon', sizes: '120x120', href: `${base}/apple-touch-icon-120x120.png` },
    { rel: 'manifest', href: `${base}/site.webmanifest` },
    { rel: 'mask-icon', href: `${base}/favicon.svg`, color },
  ];
}
