import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { conversationQueryPreferences } from './conversation-query.preferences';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationMarkReadInput } from '@repo/contracts/universal';

export async function conversationActionMarkRead(deps: ConversationServiceDeps, { botId, throughEntryId }: ConversationMarkReadInput) {
  await deps.bots.queries.get({ botId });

  match(await deps.runtime.queries.hasEntry({ botId, entryId: throughEntryId }))
    .with(true, () => undefined)
    .with(false, () => {
      throw new Errors.NOT_FOUND({ resource: 'entry', resourceId: throughEntryId });
    })
    .exhaustive();

  return conversationQueryPreferences(deps, { botId, preference: await deps.bots.actions.markRead({ botId, throughEntryId }) });
}
