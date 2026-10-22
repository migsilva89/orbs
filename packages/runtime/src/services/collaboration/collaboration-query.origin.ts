import { ATTACHMENT, entryPeerMessage, REPLY } from '@repo/contracts/universal';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from './collaboration.constants';
import { collaborationBotId } from './collaboration.utils';
import type { Context } from '@earendil-works/chord/context';
import type { Cursor, ToolExecutionApi } from '@earendil-works/pi-durable';

/** The sending bot and how many hops the request it is answering already took; owner input counts as 0. */
export async function collaborationQueryOrigin(api: ToolExecutionApi, context: Context) {
  const botId = await collaborationBotId(api, context);

  const hops = await api.commit(async (tx) => {
    return readOrigin();

    async function readOrigin(cursor?: Cursor): Promise<number> {
      const page = await tx.scanEntries({ conversationId: api.conversationId, order: 'descending' }, 50, cursor);

      const input = page.items.find((entry) => (
        entry.kind === 'pi.user' || entry.kind === REPLY.entryKind || entry.kind === ATTACHMENT.entryKind || entry.kind === COLLABORATION.message || entry.kind === COLLABORATION.reply
      ));

      return match(input)
        .with({ kind: P.union(COLLABORATION.message, COLLABORATION.reply) }, (entry) => (
          entryPeerMessage.safeParse(entry.data).data?.hops ?? Number.POSITIVE_INFINITY
        ))
        .with(P.nonNullable, () => 0)
        .otherwise(() => match(page.next)
          .with(P.nonNullable, readOrigin)
          // Nothing to trace the request to, so it may not start a chain.
          .otherwise(() => Number.POSITIVE_INFINITY));
    }
  }, context);

  return { botId, hops };
}
