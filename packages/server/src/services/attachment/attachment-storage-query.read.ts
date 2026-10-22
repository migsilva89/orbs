import { Errors } from '@repo/errors/universal';
import { constants } from 'node:fs';
import { open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { match } from 'ts-pattern';
import { attachmentStorageDirectory, attachmentStoragePath } from './attachment-storage.utils';
import type { AttachmentStorageDeps, AttachmentStorageParams } from '../../types/attachment-storage.types';

export async function attachmentStorageQueryRead(deps: AttachmentStorageDeps, params: AttachmentStorageParams) {
  const path = await attachmentStoragePath(deps, params);

  try {
    await attachmentStorageDirectory(dirname(path));
    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);

    try {
      const stat = await file.stat();
      match(stat.isFile() && stat.size === params.attachment.size)
        .with(true, () => undefined)
        .with(false, () => {
          throw new Errors.NOT_FOUND({ resource: 'attachment' });
        })
        .exhaustive();
      const bytes = new Uint8Array(await file.readFile());
      return new File([bytes], params.attachment.name, { type: params.attachment.mediaType });
    } finally {
      await file.close();
    }
  } catch (error) {
    return match(error)
      .with({ code: 'ENOENT' }, () => {
        throw new Errors.NOT_FOUND({ resource: 'attachment' });
      })
      .otherwise(() => {
        throw error;
      });
  }
}
