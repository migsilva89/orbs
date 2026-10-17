import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationHistoryInput } from '@openbots/contracts/universal';

export async function conversationQueryHistory({ runtime, bots }: ConversationServiceDeps, params: ConversationHistoryInput) {
  await bots.queries.get({ botId: params.botId });

  return runtime.queries.history(params);
}
