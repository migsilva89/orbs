import { openNodeSqliteStorage } from '@earendil-works/pi-durable/storage/sqlite/node';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { match } from 'ts-pattern';
import { STORAGE } from './storage.constants';
import type * as StorageTypes from '../../types/storage.types';

export function makeStorageService({ root }: StorageTypes.StorageServiceParams): StorageTypes.StorageService {
  return {
    open: async ({ botId }) => {
      await mkdir(join(root, botId), { recursive: true, mode: 0o700 });
      return openNodeSqliteStorage(join(root, botId, STORAGE.current));
    },
    reset: async ({ botId }) => {
      await Promise.all(STORAGE.sidecars.map((suffix) => rm(join(root, botId, `${STORAGE.current}${suffix}`), { force: true })));
    },
    remove: async ({ botId }) => {
      await rm(join(root, botId), { recursive: true, force: true });
    },
    saveCarry: async ({ botId, carry }) => {
      const path = join(root, botId, STORAGE.carry);
      await writeFile(`${path}.tmp`, JSON.stringify(carry), { mode: 0o600 });
      await rename(`${path}.tmp`, path);
    },
    readCarry: async ({ botId }) => {
      try {
        return JSON.parse(await readFile(join(root, botId, STORAGE.carry), 'utf8'));
      } catch (error) {
        return match(error)
          .with({ code: 'ENOENT' }, () => null)
          .otherwise(() => {
            throw error;
          });
      }
    },
    removeCarry: async ({ botId }) => {
      await rm(join(root, botId, STORAGE.carry), { force: true });
    },
  };
}
