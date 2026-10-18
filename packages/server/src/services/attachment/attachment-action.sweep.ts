import { match } from 'ts-pattern';
import type { AttachmentStorageTarget } from '../../types/attachment-storage.types';
import type { AttachmentServiceDeps } from '../../types/attachment.types';

export async function attachmentActionSweep({ runtime, storage }: AttachmentServiceDeps, target: AttachmentStorageTarget) {
  const expired = await runtime.actions.expireAttachments(target);
  await Promise.all(expired.map((attachment) => storage.actions.remove({ ...target, attachment })));

  const stale = await storage.queries.stale(target);
  await Promise.all(stale.map(async (attachment) => {
    try {
      await runtime.queries.attachment({ ...target, attachmentId: attachment.id });
    } catch (error) {
      await match(error)
        .with({ code: 'NOT_FOUND' }, () => storage.actions.remove({ ...target, attachment }))
        .otherwise(() => {
          throw error;
        });
    }
  }));
}
