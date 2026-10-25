import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeAttachmentIsExpired } from './runtime-attachment.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeActionExpireAttachments(
  deps: RuntimeServiceDeps,
  params: RuntimeConversationParams & RuntimeContextInput,
) {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);

  return conversation.commit(async (tx) => {
    const document = await tx.doc(runtimeAttachments, conversation.id);

    const expired = Object.values(document.files)
      .filter((file) => runtimeAttachmentIsExpired(file))
      .map((file) => ({ ...file }));

    const expiredIds = new Set(expired.map((file) => file.id));

    document.files = Object.fromEntries(Object.entries(document.files).filter(([id]) => !expiredIds.has(id)));

    return expired;
  }, context);
}
