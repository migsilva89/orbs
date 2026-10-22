import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationContextsInput } from '@repo/contracts/universal';

export async function conversationQueryContexts({ runtime, bots }: ConversationServiceDeps, params: ConversationContextsInput) {
  await bots.queries.get({ botId: params.botId });

  return runtime.queries.contexts(params);
}
