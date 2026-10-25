import { z } from 'zod';

export const htmlFrameMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('bots.html-height'), height: z.number().finite().nonnegative() }),
  z.object({ type: z.literal('bots.html-link'), url: z.url({ protocol: /^https?$/ }) }),
]);

export const htmlFrameMessageText = z.string().transform((text, context) => {
  try {
    return JSON.parse(text);
  } catch {
    context.addIssue({ code: 'custom', message: 'Expected a JSON message' });
    return z.NEVER;
  }
}).pipe(htmlFrameMessage);
