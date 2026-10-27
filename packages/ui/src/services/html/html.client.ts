import { queryOptions } from '@tanstack/react-query';
import { HTML_FRAME } from './html.constants';
import type { HtmlFrameFont } from '../../types/html.types';

export const htmlFrameFonts = queryOptions({
  queryKey: ['html-frame-fonts'],
  queryFn: (): Promise<HtmlFrameFont[]> => Promise.all(HTML_FRAME.fonts.map(async ({ url, unicodeRange }) => ({
    key: url,
    family: 'Inter',
    source: await (await fetch(url)).arrayBuffer(),
    descriptors: { weight: '100 900', style: 'normal', unicodeRange },
  }))),
  staleTime: Number.POSITIVE_INFINITY,
  gcTime: Number.POSITIVE_INFINITY,
  retry: false,
});
