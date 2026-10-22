import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationTarget } from '@repo/contracts/universal';

export async function conversationQueryContextUsage({ runtime, bots }: ConversationServiceDeps, params: ConversationTarget) {
  await bots.queries.get({ botId: params.botId });

  return runtime.queries.contextUsage(params);
}
