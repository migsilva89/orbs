import { StorageRequestError } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeHistoryParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { EntryId } from '@earendil-works/pi-durable';

export async function runtimeQueryHistory(
  deps: RuntimeServiceDeps,
  { botId, conversationId, limit = 50, cursor, afterEntryId, throughEntryId }: RuntimeHistoryParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, { botId, conversationId }, context);

  try {
    return await conversation.entries({
      ...match(afterEntryId)
        .with(P.number, (id) => ({ order: 'ascending' as const, minEntryId: (id + 1) as EntryId }))
        .otherwise(() => ({ order: 'descending' as const })),
      maxEntryId: throughEntryId as EntryId | undefined,
    }, limit, cursor, context);
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(StorageRequestError), (cause) => new Errors.VALIDATION_ERROR({ fields: {}, cause }))
      .otherwise((cause) => cause);
  }
}
