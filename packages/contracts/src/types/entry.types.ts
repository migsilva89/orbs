import { z } from 'zod';

/** Entry kinds a client renders. Pi writes the `pi.*` kinds; Openbots writes peer and subagent entries. */
export const ENTRY = {
  user: 'pi.user',
  assistant: 'pi.assistant',
  toolResult: 'pi.tool-result',
  reset: 'pi.reset',
  compaction: 'pi.compaction',
  peerMessage: 'openbots.bot-message',
  peerReply: 'openbots.bot-reply',
  subagentReport: 'openbots.subagent-report',
} as const;

export const entryPeerMessage = z.object({
  fromBotId: z.uuid(),
  toBotId: z.uuid(),
  deliveryId: z.number().int().positive(),
});

export const entryPeerReply = entryPeerMessage.extend({
  result: z.discriminatedUnion('status', [
    z.object({
      status: z.literal('answered'),
      answerId: z.number().int().positive(),
      text: z.string(),
    }),
    z.object({ status: z.literal('unanswered'), reason: z.string() }),
  ]),
});

export const entrySubagentReport = z.object({
  name: z.string(),
  conversationId: z.number().int().positive(),
  status: z.enum(['answered', 'failed']),
});

export type EntryPeerMessage = z.infer<typeof entryPeerMessage>;
export type EntryPeerReply = z.infer<typeof entryPeerReply>;
export type EntrySubagentReport = z.infer<typeof entrySubagentReport>;
