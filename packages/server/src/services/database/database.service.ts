import { Kysely } from 'kysely';
import { Migrator } from 'kysely/migration';
import { DatabaseSync } from 'node:sqlite';
import { databaseDriverDialect, databaseDriverLoadMigrations, databaseDriverMigrations } from './database.driver';
import type { DatabaseSchema, DatabaseServiceParams } from '../../types/database.types';

export function makeDatabaseService(params: DatabaseServiceParams) {
  const sqlite = new DatabaseSync(params.path);

  try {
    sqlite.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

    const db = new Kysely<DatabaseSchema>({
      dialect: databaseDriverDialect({ database: sqlite }),
    });

    const migrator = new Migrator({
      db,
      provider: databaseDriverMigrations({ database: sqlite, migrations: params.migrations ?? databaseDriverLoadMigrations() }),
    });

    return {
      db,
      migrate: async () => {
        const { error } = await migrator.migrateToLatest();

        if (error) {
          throw error;
        }
      },
      close: () => sqlite.close(),
    };
  } catch (error) {
    sqlite.close();
    throw error;
  }
}

export type DatabaseService = ReturnType<typeof makeDatabaseService>;
