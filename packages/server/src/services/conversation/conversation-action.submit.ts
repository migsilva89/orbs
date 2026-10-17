import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSubmitInput } from '@openbots/contracts/universal';

export async function conversationActionSubmit({ runtime }: ConversationServiceDeps, params: ConversationSubmitInput) {
  const submission = await runtime.actions.submit(params);

  return { submissionId: submission.id };
}
