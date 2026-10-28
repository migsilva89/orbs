import { linkResolverQueryPublic } from './link-resolver-query.public';
import type { LinkResolverPublicParams } from '../../types/link.types';

export function makeLinkResolverService() {
  return {
    queries: {
      isPublic: (params: LinkResolverPublicParams) => linkResolverQueryPublic(params),
    },
  };
}

export type LinkResolverService = ReturnType<typeof makeLinkResolverService>;
