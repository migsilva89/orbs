import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { match } from 'ts-pattern';
import { STORAGE } from './storage.constants';
import type * as StorageTypes from '../../types/storage.types';

/**
 * One Pi store per bot, so deleting or clearing a bot removes its files. The daemon lock guards all of them.
 * Store files are deleted, never renamed: SQLite on macOS rejects reopening a database file renamed in-process.
 */
export function makeStorageService({ root }: StorageTypes.StorageServiceParams): StorageTypes.StorageService {
  const directory = (botId: string) => join(root, botId);

  return {
    open: async ({ botId }) => {
      await mkdir(directory(botId), { recursive: true, mode: 0o700 });
      return openNodeSqliteStorage(join(directory(botId), STORAGE.current));
    },
    reset: async ({ botId }) => {
      await Promise.all(STORAGE.sidecars.map((suffix) => rm(join(directory(botId), `${STORAGE.current}${suffix}`), { force: true })));
    },
    remove: async ({ botId }) => {
      await rm(directory(botId), { recursive: true, force: true });
    },
    saveCarry: async ({ botId, carry }) => {
      const path = join(directory(botId), STORAGE.carry);
      await writeFile(`${path}.tmp`, JSON.stringify(carry), { mode: 0o600 });
      await rename(`${path}.tmp`, path);
    },
    readCarry: async ({ botId }) => {
      try {
        return JSON.parse(await readFile(join(directory(botId), STORAGE.carry), 'utf8'));
      } catch (error) {
        return match(error)
          .with({ code: 'ENOENT' }, () => null)
          .otherwise(() => {
            throw error;
          });
      }
    },
    removeCarry: async ({ botId }) => {
      await rm(join(directory(botId), STORAGE.carry), { force: true });
    },
  };
}
