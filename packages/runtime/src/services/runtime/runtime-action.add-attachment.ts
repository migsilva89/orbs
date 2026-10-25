import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeAttachmentAddParams } from '../../types/runtime-attachment.types';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeActionAddAttachment(
  deps: RuntimeServiceDeps,
  params: RuntimeAttachmentAddParams & RuntimeContextInput,
) {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);

  return conversation.commit(async (tx) => {
    const files = (await tx.doc(runtimeAttachments, conversation.id)).files;

    match(files[params.attachment.id])
      .with(P.nonNullable, () => {
        throw new Errors.CONFLICT();
      })
      .otherwise(() => {
        files[params.attachment.id] = params.attachment;
      });

    return { ...params.attachment };
  }, context);
}
