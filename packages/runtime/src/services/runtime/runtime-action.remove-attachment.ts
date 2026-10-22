import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeAttachmentIdParams } from '../../types/attachment.types';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeActionRemoveAttachment(
  deps: RuntimeServiceDeps,
  params: RuntimeAttachmentIdParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, params, context);

  return conversation.commit(async (tx) => {
    const document = await tx.doc(runtimeAttachments, conversation.id);
    const file = document.files[params.attachmentId];

    return match(file)
      .with(P.nullish, () => {
        throw new Errors.NOT_FOUND({ resource: 'attachment', resourceId: params.attachmentId });
      })
      .with({ isRetained: true }, () => {
        throw new Errors.CONFLICT();
      })
      .with({ isRetained: false }, (value) => {
        const copy = { ...value };
        document.files = Object.fromEntries(Object.entries(document.files).filter(([id]) => id !== params.attachmentId));

        return copy;
      })
      .exhaustive();
  }, context);
}
