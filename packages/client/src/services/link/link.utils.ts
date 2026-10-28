import { linkUrl } from '@repo/contracts/universal';
import { LINK } from './link.constants';

export function linkHost(href: string) {
  return linkUrl.safeParse(href).success ? new URL(href).hostname.replace(/^www\./, '') : null;
}

export function linkFaviconUrl(href: string) {
  const host = linkHost(href);

  return host ? `${LINK.faviconUrl}?domain=${encodeURIComponent(host)}&sz=${LINK.faviconSize}` : null;
}
