import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeAttachmentIdParams } from '../../types/attachment.types';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryAttachment(
  deps: RuntimeServiceDeps,
  params: RuntimeAttachmentIdParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  const files = (await deps.harness.snapshot(runtimeAttachments, conversation.id, context))?.files ?? {};
  const attachment = files[params.attachmentId];

  return match(attachment)
    .with(P.nonNullable, (value) => ({ conversationId: conversation.id, attachment: value }))
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'attachment', resourceId: params.attachmentId });
    });
}
