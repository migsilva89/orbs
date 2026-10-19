import { createFaviconLinks, createMetadata } from '@openbots/tanstack-helpers/universal';
import { createRootRouteWithContext } from '@tanstack/react-router';
import { LayoutRootDocument, LayoutRootError, LayoutRootNotFound } from '@/components/layout/layout-root';
import { SEO_METADATA_DEFAULTS } from '@/services/seo/seo.constants';
import appCss from '../application/styles.css?url';
import type { RouterContext } from '@/types/router.types';

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: createMetadata({ defaults: SEO_METADATA_DEFAULTS }),
    links: [
      { rel: 'stylesheet', href: appCss },
      ...createFaviconLinks(),
    ],
  }),
  shellComponent: LayoutRootDocument,
  errorComponent: LayoutRootError,
  notFoundComponent: LayoutRootNotFound,
});
