import { constants } from 'node:fs';
import { mkdir, open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { attachmentStorageDirectory, attachmentStoragePath } from './attachment-storage.utils';
import type { AttachmentStorageDeps, AttachmentStorageWriteParams } from '../../types/attachment-storage.types';

export async function attachmentStorageActionWrite(deps: AttachmentStorageDeps, params: AttachmentStorageWriteParams) {
  const path = await attachmentStoragePath(deps, params);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await attachmentStorageDirectory(dirname(path));
  const file = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);

  try {
    await file.writeFile(new Uint8Array(await params.file.arrayBuffer()));
    await file.sync();
  } finally {
    await file.close();
  }
}

