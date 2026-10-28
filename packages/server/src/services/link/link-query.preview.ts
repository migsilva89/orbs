import { log } from '@repo/logger/server';
import { linkDriverFetchHead } from './link.driver';
import { linkPreviewParse } from './link.utils';
import type { LinkServiceDeps } from '../../types/link.types';
import type { LinkPreview, LinkPreviewInput } from '@repo/contracts/universal';

export async function linkQueryPreview(deps: LinkServiceDeps, { url }: LinkPreviewInput): Promise<LinkPreview | null> {
  try {
    const page = await linkDriverFetchHead(deps, { url });

    return page ? linkPreviewParse(page.url, page.html) : null;
  } catch (error) {
    log.debug({
      tag: 'link',
      message: 'Link preview could not be read',
      error,
    });

    return null;
  }
}
