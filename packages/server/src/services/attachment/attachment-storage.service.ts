import { attachmentStorageActionClear } from './attachment-storage-action.clear';
import { attachmentStorageActionRemove } from './attachment-storage-action.remove';
import { attachmentStorageActionWrite } from './attachment-storage-action.write';
import { attachmentStorageQueryRead } from './attachment-storage-query.read';
import { attachmentStorageQueryStale } from './attachment-storage-query.stale';
import type * as AttachmentStorageTypes from '../../types/attachment-storage.types';
import type { BotGetInput } from '@repo/contracts/universal';

export function makeAttachmentStorageService(deps: AttachmentStorageTypes.AttachmentStorageDeps) {
  return {
    actions: {
      write: (params: AttachmentStorageTypes.AttachmentStorageWriteParams) => attachmentStorageActionWrite(deps, params),
      remove: (params: AttachmentStorageTypes.AttachmentStorageParams) => attachmentStorageActionRemove(deps, params),
      clear: (params: BotGetInput) => attachmentStorageActionClear(deps, params),
    },
    queries: {
      stale: (params: AttachmentStorageTypes.AttachmentStorageTarget) => attachmentStorageQueryStale(deps, params),
      read: (params: AttachmentStorageTypes.AttachmentStorageParams) => attachmentStorageQueryRead(deps, params),
    },
  };
}

export type AttachmentStorageService = ReturnType<typeof makeAttachmentStorageService>;
