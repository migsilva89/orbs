import { createJsonLd } from './json-ld';
import { createMetadata } from './metadata';
import { canonicalLocalizedLink, hreflangLinks } from './url';
import type { TanstackHeadBuilderParams, TanstackHeadParams } from './types/tanstack-head.types';
import type { TanstackMetadata } from './types/tanstack-metadata.types';
import type { TanstackUrlCanonicalLink, TanstackUrlHreflangLink } from './types/tanstack-url.types';

export function createHead(builder: TanstackHeadBuilderParams) {
  return function head(params: TanstackHeadParams) {
    const locale = builder.resolveLocale(params.locale);

    const canonical = canonicalLocalizedLink({
      origin: builder.origin,
      path: params.path,
      locale,
      baseLocale: builder.baseLocale,
    });

    const links: (TanstackUrlCanonicalLink | TanstackUrlHreflangLink)[] = [canonical];

    if (params.hreflang !== false) {
      links.push(
        ...hreflangLinks({
          origin: builder.origin,
          path: params.path,
          locales: builder.locales,
          baseLocale: builder.baseLocale,
        }),
      );
    }

    const openGraphLocale = builder.formatOpenGraphLocale?.(locale);

    const openGraph: NonNullable<TanstackMetadata['openGraph']> = {
      url: canonical.href,
      ...params.metadata?.openGraph,
    };

    if (openGraphLocale) {
      openGraph.locale = openGraphLocale;
    }

    const routeMetadata: TanstackMetadata = {
      ...params.metadata,
      title: params.title,
      description: params.description,
      openGraph,
    };

    if (params.robots !== undefined) {
      routeMetadata.robots = params.robots;
    }

    return {
      meta: createMetadata({ defaults: builder.defaults, metadata: routeMetadata }),
      links,
      scripts: params.schemas && params.schemas.length > 0
        ? [{ type: 'application/ld+json', children: createJsonLd(params.schemas) }]
        : undefined,
      canonicalHref: canonical.href,
    };
  };
}
