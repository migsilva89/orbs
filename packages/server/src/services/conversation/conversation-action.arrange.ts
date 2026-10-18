import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationArrangeInput } from '@openbots/contracts/universal';

export async function conversationActionArrange({ runtime, bots }: ConversationServiceDeps, params: ConversationArrangeInput) {
  await Promise.all(params.botIds.map((botId) => bots.queries.get({ botId })));
  return runtime.actions.arrange(params);
}
