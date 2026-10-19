import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { conversationQueryPreferences } from './conversation-query.preferences';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSetMutedInput } from '@openbots/contracts/universal';

export async function conversationActionSetMuted(deps: ConversationServiceDeps, { botId, isMuted, mutedUntil }: ConversationSetMutedInput) {
  match({ isMuted, mutedUntil })
    .with({ isMuted: true, mutedUntil: P.number.lte(Date.now()) }, () => {
      throw new Errors.VALIDATION_ERROR({ fields: { mutedUntil: { message: 'validation_muted_until' } } });
    })
    .otherwise(() => undefined);

  const preference = await deps.bots.actions.setPreferences({
    botId,
    isMuted,
    mutedUntil: isMuted ? mutedUntil : null,
  });

  return conversationQueryPreferences(deps, { botId, preference });
}
