import type { AttachmentServiceDeps } from '../../types/attachment.types';
import type { AttachmentGetInput } from '@repo/contracts/universal';

export async function attachmentQueryDownload({ runtime, storage }: AttachmentServiceDeps, params: AttachmentGetInput) {
  const { conversationId, attachment } = await runtime.queries.attachment(params);
  return storage.queries.read({
    botId: params.botId,
    conversationId,
    attachment,
  });
}
