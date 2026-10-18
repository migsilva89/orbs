import { StorageRequestError } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeHistoryPage } from './runtime-history.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeSearchParams } from '../../types/history.types';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationSearchPage } from '@openbots/contracts/universal';

export async function runtimeQuerySearch(
  deps: RuntimeServiceDeps,
  params: RuntimeSearchParams,
  context: Context,
): Promise<ConversationSearchPage> {
  const conversation = await runtimeQueryConversation(deps, params, context);

  try {
    const page = await conversation.entries({ order: 'descending' }, params.limit ?? 50, params.cursor, context);
    return runtimeHistoryPage(page, params.query);
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(StorageRequestError), (cause) => new Errors.VALIDATION_ERROR({ fields: {}, cause }))
      .otherwise((cause) => cause);
  }
}
