import { z } from 'zod';

export const REPLY = { entryKind: 'bots.reply-message', silent: ['NO_REPLY', '<|eos|>'] } as const;

/** Assistant text that means "nothing to say": the prompt's NO_REPLY or a model end token leaked as text. */
export const replySilent = z.string().trim().pipe(z.enum(REPLY.silent));

export const messageQuote = z.object({
  entryId: z.number().int().positive(),
  role: z.enum(['user', 'assistant']),
  botId: z.uuid().optional(),
  content: z.string().max(4000),
});

export const replyMessage = z.object({ content: z.string(), replyTo: messageQuote });

export type MessageQuote = z.infer<typeof messageQuote>;
