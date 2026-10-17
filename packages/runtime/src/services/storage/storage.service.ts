import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';
import { Errors } from '@openbots/errors/universal';
import { existsSync } from 'node:fs';
import { mkdir, realpath } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { StorageServiceParams } from '../../types/storage.types';

export async function makeStorageService({ path }: StorageServiceParams) {
  await mkdir(dirname(resolve(path)), { recursive: true });

  const file = existsSync(path) ? await realpath(path) : join(await realpath(dirname(resolve(path))), basename(path));
  const lock = new DatabaseSync(`${file}.lock`);

  try {
    lock.exec('BEGIN EXCLUSIVE');
  } catch (error) {
    lock.close();

    if (error instanceof Error && 'errcode' in error && (error.errcode === 5 || error.errcode === 6)) {
      throw new Errors.CONFLICT({ internal: 'Runtime storage is already open', cause: error });
    }

    throw error;
  }

  try {
    const storage = await openNodeSqliteStorage(file);
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
