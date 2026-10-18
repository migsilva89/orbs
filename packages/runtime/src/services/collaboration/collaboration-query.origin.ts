import { ATTACHMENT, REPLY } from '@openbots/contracts/universal';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from './collaboration.constants';
import { collaborationBotId } from './collaboration.utils';
import type { Context } from '@earendil-works/chord/context';
import type { Cursor, ToolExecutionApi } from '@earendil-works/pi-durable';

export async function collaborationQueryOrigin(api: ToolExecutionApi, context: Context) {
  const botId = await collaborationBotId(api, context);

  const isPeerInput = await api.commit(async (tx) => {
    return readOrigin();

    async function readOrigin(cursor?: Cursor): Promise<boolean> {
      const page = await tx.scanEntries({ conversationId: api.conversationId, order: 'descending' }, 50, cursor);

      const input = page.items.find((entry) => (
        entry.kind === 'pi.user' || entry.kind === REPLY.entryKind || entry.kind === ATTACHMENT.entryKind || entry.kind === COLLABORATION.message || entry.kind === COLLABORATION.reply
      ));

      return match(input)
        .with(P.nonNullable, (entry) => entry.kind === COLLABORATION.message || entry.kind === COLLABORATION.reply)
        .otherwise(() => match(page.next)
          .with(P.nonNullable, readOrigin)
          .otherwise(() => true));
    }
  }, context);

  return { botId, isPeerInput };
}
