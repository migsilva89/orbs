import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSubmitInput } from '@openbots/contracts/universal';

export async function conversationActionSubmit({ runtime, bots }: ConversationServiceDeps, params: ConversationSubmitInput) {
  await bots.actions.configure({ botId: params.botId });
  const submission = await runtime.actions.submit(params);

  return { submissionId: submission.id };
}
