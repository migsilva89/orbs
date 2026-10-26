import { ATTACHMENT, ENTRY, entryOwnerNote, entryPeerMessage, REPLY } from '@repo/contracts/universal';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from './collaboration.constants';
import { collaborationBotId } from './collaboration.utils';
import type { Context } from '@earendil-works/chord/context';
import type { Cursor, ToolExecutionApi } from '@earendil-works/pi-durable';

export async function collaborationQueryOrigin(api: ToolExecutionApi, context: Context) {
  const botId = await collaborationBotId(api, context);

  const hops = await api.commit(async (tx) => {
    return collaborationReadOrigin();

    async function collaborationReadOrigin(cursor?: Cursor): Promise<number> {
      const page = await tx.scanEntries({ conversationId: api.conversationId, order: 'descending' }, 50, cursor);

      const input = page.items.find((entry) => (
        entry.kind === 'pi.user' || entry.kind === ENTRY.routineRun || entry.kind === REPLY.entryKind || entry.kind === ATTACHMENT.entryKind || entry.kind === COLLABORATION.message || entry.kind === COLLABORATION.reply || entry.kind === COLLABORATION.note
      ));

      return match(input)
        .with({ kind: P.union(COLLABORATION.message, COLLABORATION.reply) }, (entry) => (
          entryPeerMessage.safeParse(entry.data).data?.hops ?? Number.POSITIVE_INFINITY
        ))
        .with({ kind: COLLABORATION.note }, (entry) => entryOwnerNote.safeParse(entry.data).data?.hops ?? Number.POSITIVE_INFINITY)
        .with(P.nonNullable, () => 0)
        .otherwise(() => match(page.next)
          .with(P.nonNullable, collaborationReadOrigin)
          .otherwise(() => Number.POSITIVE_INFINITY));
    }
  }, context);

  return { botId, hops };
}
