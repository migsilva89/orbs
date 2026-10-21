import { z } from 'zod';

export const htmlFrameMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('openbots.html-height'), height: z.number().finite().nonnegative() }),
  z.object({ type: z.literal('openbots.html-link'), url: z.url({ protocol: /^https?$/ }) }),
]);

/** A frame message posted as text by a native WebView; a page can post any string, so text that is not JSON fails validation. */
export const htmlFrameMessageText = z.string().transform((text, context) => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    context.addIssue({ code: 'custom', message: 'Expected a JSON message' });
    return z.NEVER;
  }
}).pipe(htmlFrameMessage);
