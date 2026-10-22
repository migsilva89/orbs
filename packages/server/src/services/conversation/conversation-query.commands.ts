import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationTarget } from '@repo/contracts/universal';

export async function conversationQueryCommands({ runtime, bots }: ConversationServiceDeps, params: ConversationTarget) {
  await bots.queries.get(params);

  return runtime.queries.commands();
}
