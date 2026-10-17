import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationTarget } from '@openbots/contracts/universal';

export async function conversationActionStop({ runtime, bots }: ConversationServiceDeps, params: ConversationTarget) {
  await bots.queries.get(params);
  await runtime.actions.stop(params);
}
