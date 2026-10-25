import { openNodeSqliteDatabase } from '@earendil-works/chord/sqlite/node';
import { createSqliteTelemetry } from '@earendil-works/chord/telemetry-sqlite';
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
    openTelemetry: async ({ botId }) => {
      await mkdir(join(root, botId), { recursive: true, mode: 0o700 });
      const database = await openNodeSqliteDatabase(join(root, botId, STORAGE.telemetry));

      try {
        const telemetry = await createSqliteTelemetry(database, { retentionMs: STORAGE.telemetryRetentionMs });

        return {
          telemetry,
          close: async () => {
            await telemetry.close().finally(() => database.close());
          },
        };
      } catch (error) {
        await database.close();
        throw error;
      }
    },
    reset: async ({ botId }) => {
      const files = [STORAGE.current, STORAGE.telemetry].flatMap((file) => STORAGE.sidecars.map((suffix) => `${file}${suffix}`));
      await Promise.all(files.map((file) => rm(join(root, botId, file), { force: true })));
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
