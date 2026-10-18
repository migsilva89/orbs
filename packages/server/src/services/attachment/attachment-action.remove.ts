import type { AttachmentServiceDeps } from '../../types/attachment.types';
import type { AttachmentGetInput } from '@openbots/contracts/universal';

export async function attachmentActionRemove({ runtime, storage }: AttachmentServiceDeps, params: AttachmentGetInput) {
  const conversationId = await runtime.queries.attachmentTarget(params);
  const attachment = await runtime.actions.removeAttachment({ ...params, conversationId });
  await storage.actions.remove({
    botId: params.botId,
    conversationId,
    attachment,
  });
}
