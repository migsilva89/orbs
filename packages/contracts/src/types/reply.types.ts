import { z } from 'zod';

export const REPLY = { entryKind: 'bots.reply-message' } as const;

export const messageQuote = z.object({
  entryId: z.number().int().positive(),
  role: z.enum(['user', 'assistant']),
  botId: z.uuid().optional(),
  content: z.string().max(4000),
});

export const replyMessage = z.object({ content: z.string(), replyTo: messageQuote });

export type MessageQuote = z.infer<typeof messageQuote>;
