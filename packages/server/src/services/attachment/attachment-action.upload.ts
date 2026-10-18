import { attachmentActionSweep } from './attachment-action.sweep';
import { attachmentName } from './attachment.utils';
import type { AttachmentServiceDeps } from '../../types/attachment.types';
import type { AttachmentUploadInput } from '@openbots/contracts/universal';

export async function attachmentActionUpload(deps: AttachmentServiceDeps, params: AttachmentUploadInput) {
  const { bots, runtime, storage } = deps;
  await bots.queries.get({ botId: params.botId });
  const conversationId = await runtime.queries.attachmentTarget(params);
  const target = { botId: params.botId, conversationId };
  await attachmentActionSweep(deps, target);

  const attachment = {
    id: crypto.randomUUID(),
    name: attachmentName(params.file.name),
    mediaType: params.file.type.split(';', 1)[0]?.trim() ?? '',
    size: params.file.size,
    createdAt: Date.now(),
    isRetained: false,
  };

  await storage.actions.write({
    ...target,
    attachment,
    file: params.file,
  });

  try {
    await runtime.actions.addAttachment({ ...target, attachment });
    return attachment;
  } catch (error) {
    await storage.actions.remove({ ...target, attachment });
    throw error;
  }
}
