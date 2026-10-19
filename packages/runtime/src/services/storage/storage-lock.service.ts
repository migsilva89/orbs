import { Errors } from '@openbots/errors/universal';
import { existsSync } from 'node:fs';
import { mkdir, realpath } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { match, P } from 'ts-pattern';
import type { StorageServiceParams } from '../../types/storage.types';

export async function makeStorageLockService({ path }: StorageServiceParams) {
  await mkdir(dirname(resolve(path)), { recursive: true });

  const file = await match(existsSync(path))
    .with(true, () => realpath(path))
    .with(false, async () => join(await realpath(dirname(resolve(path))), basename(path)))
    .exhaustive();

  const database = new DatabaseSync(`${file}.lock`);

  try {
    database.exec('BEGIN EXCLUSIVE');
  } catch (error) {
    database.close();

    throw match(error)
      .with({ errcode: P.union(5, 6) }, () => new Errors.CONFLICT({ internal: 'Runtime storage is already open', cause: error }))
      .otherwise(() => error);
  }

  return {
    path: file,
    close: () => database.close(),
  };
}

export type StorageLockService = Awaited<ReturnType<typeof makeStorageLockService>>;
