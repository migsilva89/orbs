import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeAttachments } from './runtime-attachment.constants';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeAttachmentIdParams } from '../../types/runtime-attachment.types';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeQueryAttachment(
  deps: RuntimeServiceDeps,
  params: RuntimeAttachmentIdParams & RuntimeContextInput,
) {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);
  const files = (await deps.harness.snapshot(runtimeAttachments, conversation.id, context))?.files ?? {};
  const attachment = files[params.attachmentId];

  return match(attachment)
    .with(P.nonNullable, (value) => ({ conversationId: conversation.id, attachment: value }))
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'attachment', resourceId: params.attachmentId });
    });
}
