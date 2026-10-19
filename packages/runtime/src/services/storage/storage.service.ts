import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';
import { makeStorageLockService } from './storage-lock.service';
import type { StorageServiceParams } from '../../types/storage.types';

export async function makeStorageService({ path }: StorageServiceParams) {
  const lock = await makeStorageLockService({ path });

  try {
    const storage = await openNodeSqliteStorage(lock.path);
    let closing: Promise<void> | undefined;

    return {
      storage,
      close: () => {
        closing ??= storage.close(BACKGROUND_CONTEXT).finally(() => lock.close());
        return closing;
      },
    };
  } catch (error) {
    lock.close();
    throw error;
  }
}
