import { linkQueryPreview } from './link-query.preview';
import type { LinkServiceDeps } from '../../types/link.types';
import type { LinkPreviewInput } from '@repo/contracts/universal';

export function makeLinkService(deps: LinkServiceDeps) {
  return {
    queries: {
      preview: (params: LinkPreviewInput) => linkQueryPreview(deps, params),
    },
  };
}

export type LinkService = ReturnType<typeof makeLinkService>;
