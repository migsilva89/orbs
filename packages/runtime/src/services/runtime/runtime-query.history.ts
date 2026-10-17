import { StorageRequestError } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeHistoryParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryHistory(
  deps: RuntimeServiceDeps,
  { botId, limit = 50, cursor }: RuntimeHistoryParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, { botId }, context);

  try {
    return await conversation.entries({ order: 'descending' }, limit, cursor, context);
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(StorageRequestError), (cause) => new Errors.VALIDATION_ERROR({ fields: {}, cause }))
      .otherwise((cause) => cause);
  }
}
