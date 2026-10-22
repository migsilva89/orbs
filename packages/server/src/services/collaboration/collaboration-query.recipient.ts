import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { CollaborationServiceDeps } from '../../types/collaboration.types';
import type { CollaborationRecipientParams } from '@repo/runtime/server';

export async function collaborationQueryRecipient(
  { database }: CollaborationServiceDeps,
  { botId, recipientId, isPeerInput }: CollaborationRecipientParams,
) {
  match(isPeerInput || botId === recipientId)
    .with(true, () => {
      throw new Errors.FORBIDDEN({ internal: 'Peer messages cannot delegate again or target their sender.' });
    })
    .with(false, () => undefined)
    .exhaustive();

  const bots = await database.db.selectFrom('bot')
    .select(['id', 'name', 'handle'])
    .where('id', 'in', [botId, recipientId])
    .execute();

  const sender = bots.find((bot) => bot.id === botId);
  const recipient = bots.find((bot) => bot.id === recipientId);

  return match({ sender, recipient })
    .with({ sender: P.nonNullable, recipient: P.nonNullable }, (pair) => ({ ...pair, maxPending: 8, temporaryTtlMs: 2 * 24 * 60 * 60 * 1000 }))
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: recipientId });
    });
}
