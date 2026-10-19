import type { TanstackMetadata } from '@openbots/tanstack-helpers/universal';

const SEO_APP_NAME = 'Openbots';

export const SEO_METADATA_DEFAULTS: TanstackMetadata = {
  charSet: 'utf-8',
  title: SEO_APP_NAME,
  titleTemplate: `%s | ${SEO_APP_NAME}`,
  robots: 'noindex, nofollow',
  viewport: {
    width: 'device-width',
    'initial-scale': '1',
    'viewport-fit': 'cover',
  },
  appleWebAppStatusBarStyle: 'black-translucent',
  applicationName: SEO_APP_NAME,
  openGraph: {
    type: 'website',
    siteName: SEO_APP_NAME,
  },
};
