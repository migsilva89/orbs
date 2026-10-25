import { StorageRequestError } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeHistoryPage } from './runtime-history.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeHistorySearchParams } from '../../types/runtime-history.types';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ConversationSearchPage } from '@repo/contracts/universal';

export async function runtimeQuerySearch(
  deps: RuntimeServiceDeps,
  params: RuntimeHistorySearchParams & RuntimeContextInput,
): Promise<ConversationSearchPage> {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);

  try {
    const page = await conversation.entries({ order: 'descending' }, params.limit ?? 50, params.cursor, context);
    return runtimeHistoryPage(page, params.query);
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(StorageRequestError), (cause) => new Errors.VALIDATION_ERROR({ fields: {}, cause }))
      .otherwise((cause) => cause);
  }
}
