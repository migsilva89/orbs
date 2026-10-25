import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeAttachmentIsExpired } from './runtime-attachment.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeAttachmentRetainParams } from '../../types/runtime-attachment.types';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeActionRetainAttachments(
  deps: RuntimeServiceDeps,
  params: RuntimeAttachmentRetainParams & RuntimeContextInput,
) {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);

  return conversation.commit(async (tx) => {
    const files = (await tx.doc(runtimeAttachments, conversation.id)).files;

    return params.attachmentIds.map((id) => match(files[id])
      .with(P.nullish, () => {
        throw new Errors.NOT_FOUND({ resource: 'attachment', resourceId: id });
      })
      .with(P.when(runtimeAttachmentIsExpired), () => {
        throw new Errors.CONFLICT();
      })
      .otherwise((file) => {
        file.isRetained = true;
        return { ...file };
      }));
  }, context);
}
