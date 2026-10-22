import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeAddAttachmentParams } from '../../types/attachment.types';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeActionAddAttachment(
  deps: RuntimeServiceDeps,
  params: RuntimeAddAttachmentParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, params, context);

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
