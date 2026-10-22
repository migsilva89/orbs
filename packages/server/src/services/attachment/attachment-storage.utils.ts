import { Errors } from '@repo/errors/universal';
import { realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { match } from 'ts-pattern';
import type { AttachmentStorageDeps, AttachmentStorageParams } from '../../types/attachment-storage.types';

export async function attachmentStoragePath({ root }: AttachmentStorageDeps, { botId, conversationId, attachment }: AttachmentStorageParams) {
  return resolve(await realpath(root), 'agents', botId, '.attachments', String(conversationId), attachment.id, attachment.name);
}

export async function attachmentStorageDirectory(path: string) {
  const actual = await realpath(path);
  match(actual === resolve(path))
    .with(true, () => undefined)
    .with(false, () => {
      throw new Errors.FORBIDDEN();
    })
    .exhaustive();
}
