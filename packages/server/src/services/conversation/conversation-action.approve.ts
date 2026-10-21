import type { ConversationApproveParams, ConversationServiceDeps } from '../../types/conversation.types';

export async function conversationActionApprove({ runtime, bots, tools }: ConversationServiceDeps, { always = false, ...params }: ConversationApproveParams) {
  await bots.queries.get({ botId: params.botId });

  const approvals = always && params.approved ? await runtime.queries.approvals({ botId: params.botId }) : [];
  const approval = approvals.find((item) => item.id === params.id);
  const result = await runtime.actions.approve(params);

  if (result.accepted && approval) {
    await tools.actions.allowAlways({ botId: params.botId, toolName: approval.toolName });
  }

  return result;
}
