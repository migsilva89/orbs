import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeAttachmentIsExpired } from './runtime-attachment.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeActionExpireAttachments(
  deps: RuntimeServiceDeps,
  params: RuntimeConversationParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, params, context);

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
