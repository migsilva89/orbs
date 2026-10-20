import { z } from 'zod';

export const htmlFrameMessage = z.discriminatedUnion('type', [
  z.object({ type: z.literal('openbots.html-height'), height: z.number().finite().nonnegative() }),
  z.object({ type: z.literal('openbots.html-link'), url: z.url({ protocol: /^https?$/ }) }),
]);
