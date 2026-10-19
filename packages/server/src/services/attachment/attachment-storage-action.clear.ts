import { realpath, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { AttachmentStorageDeps } from '../../types/attachment-storage.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function attachmentStorageActionClear({ root }: AttachmentStorageDeps, { botId }: BotGetInput) {
  await rm(resolve(await realpath(root), 'agents', botId, '.attachments'), { recursive: true, force: true });
}
