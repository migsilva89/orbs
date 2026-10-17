import type { ConversationApproveParams, ConversationServiceDeps } from '../../types/conversation.types';

export async function conversationActionApprove({ runtime, bots }: ConversationServiceDeps, params: ConversationApproveParams) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.approve(params);
}
