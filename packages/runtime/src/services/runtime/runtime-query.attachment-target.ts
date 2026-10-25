import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeQueryAttachmentTarget(
  deps: RuntimeServiceDeps,
  params: RuntimeConversationParams & RuntimeContextInput,
) {
  const conversation = await runtimeQueryConversation(deps, params);

  return conversation.id;
}
