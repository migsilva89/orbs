import { z } from 'zod';

export const REPLY = { entryKind: 'bots.reply-message', silent: ['NO_REPLY', '<|eos|>'] } as const;

export const replySilent = z.string().trim().pipe(z.enum(REPLY.silent));

export const replyQuote = z.object({
  entryId: z.number().int().positive(),
  role: z.enum(['user', 'assistant']),
  botId: z.uuid().optional(),
  content: z.string().max(4000),
});

export const replyMessage = z.object({ content: z.string(), replyTo: replyQuote });

export type ReplyQuote = z.infer<typeof replyQuote>;
