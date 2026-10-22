import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeAttachmentIsExpired } from './runtime-attachment.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeRetainAttachmentsParams } from '../../types/attachment.types';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeActionRetainAttachments(
  deps: RuntimeServiceDeps,
  params: RuntimeRetainAttachmentsParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, params, context);

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
