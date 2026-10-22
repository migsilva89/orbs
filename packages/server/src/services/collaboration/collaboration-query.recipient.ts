import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from './collaboration.constants';
import type { CollaborationServiceDeps } from '../../types/collaboration.types';
import type { CollaborationRecipientParams } from '@repo/runtime/server';

export async function collaborationQueryRecipient(
  { database }: CollaborationServiceDeps,
  { botId, recipientId, hops }: CollaborationRecipientParams,
) {
  match(botId === recipientId)
    .with(true, () => {
      throw new Errors.FORBIDDEN({ internal: 'A bot cannot message itself.' });
    })
    .with(false, () => undefined)
    .exhaustive();

  match(hops >= COLLABORATION.maxHops)
    .with(true, () => {
      throw new Errors.FORBIDDEN({ internal: `This request already passed through ${COLLABORATION.maxHops} bots and cannot be forwarded again.` });
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
    .with({ sender: P.nonNullable, recipient: P.nonNullable }, (pair) => ({
      ...pair,
      maxPending: COLLABORATION.maxPending,
      maxHops: COLLABORATION.maxHops,
      temporaryTtlMs: COLLABORATION.temporaryTtlMs,
    }))
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: recipientId });
    });
}
