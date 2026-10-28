import { linkUrl } from '@repo/contracts/universal';
import { LINK } from './link.constants';
import type { LinkDriverFetchParams, LinkPage, LinkServiceDeps } from '../../types/link.types';

function linkDriverDecoder(charset = 'utf-8') {
  try {
    return new TextDecoder(charset);
  } catch {
    return new TextDecoder();
  }
}

async function linkDriverReadHead(body: ReadableStream<Uint8Array>, contentType: string) {
  const decoder = linkDriverDecoder(/charset=([\w-]+)/i.exec(contentType)?.[1]);
  let html = '';
  let bytes = 0;

  for await (const chunk of body) {
    bytes += chunk.byteLength;
    html += decoder.decode(chunk, { stream: true });

    if (bytes >= LINK.maxBytes || /<meta[^>]+og:title/i.test(html)) {
      break;
    }
  }

  return html;
}

export async function linkDriverFetchHead(
  deps: LinkServiceDeps,
  { url, signal = AbortSignal.timeout(LINK.timeoutMs), redirects = 0 }: LinkDriverFetchParams,
): Promise<LinkPage | null> {
  if (!await deps.resolver.queries.isPublic({ hostname: new URL(url).hostname })) {
    return null;
  }

  const response = await fetch(url, {
    redirect: 'manual',
    signal,
    headers: { accept: 'text/html,application/xhtml+xml', 'user-agent': LINK.userAgent },
  });

  const location = response.headers.get('location');
  const contentType = response.headers.get('content-type') ?? '';

  if (response.status >= 300 && response.status < 400 && location) {
    await response.body?.cancel();

    const next = linkUrl.safeParse(new URL(location, url).toString());

    return next.success && redirects < LINK.maxRedirects ? linkDriverFetchHead(deps, {
      url: next.data,
      signal,
      redirects: redirects + 1,
    }) : null;
  }

  if (!response.ok || !response.body || !contentType.includes('html')) {
    await response.body?.cancel();

    return null;
  }

  return { url, html: await linkDriverReadHead(response.body, contentType) };
}
