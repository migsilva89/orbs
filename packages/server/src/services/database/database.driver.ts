import { SqliteAdapter, SqliteDialect } from 'kysely';
import { readFileSync } from 'node:fs';
import { databaseDriverBindings } from '../../types/database.types';
import type * as DatabaseTypes from '../../types/database.types';
import type { SqliteStatement } from 'kysely';
import type { MigrationProvider } from 'kysely/migration';

class DatabaseDriverAdapter extends SqliteAdapter {
  override get supportsTransactionalDdl(): boolean {
    return true;
  }
}

export function databaseDriverDialect(params: DatabaseTypes.DatabaseDriverParams): SqliteDialect {
  const dialect = new SqliteDialect({
    database: {
      close: () => params.database.close(),
      prepare: (sql): SqliteStatement => {
        const statement = params.database.prepare(sql);

        return {
          reader: statement.columns().length > 0,
          all: (parameters) => statement.all(...databaseDriverBindings.parse(parameters)),
          run: (parameters) => statement.run(...databaseDriverBindings.parse(parameters)),
          iterate: (parameters) => statement.iterate(...databaseDriverBindings.parse(parameters)),
        };
      },
    },
  });

  dialect.createAdapter = () => new DatabaseDriverAdapter();

  return dialect;
}

export function databaseDriverMigrations(params: DatabaseTypes.DatabaseDriverMigrationsParams): MigrationProvider {
  return {
    getMigrations: async () => Object.fromEntries(Object.entries(params.migrations).map(([name, sql]) => [name, {
      up: async () => {
        params.database.exec(sql);
      },
    }])),
  };
}

export function databaseDriverLoadMigrations() {
  return {
    '0001_pairing': readFileSync(new URL('./migrations/0001_pairing.sql', import.meta.url), 'utf8'),
    '0002_pairing_claimed_at': readFileSync(new URL('./migrations/0002_pairing_claimed_at.sql', import.meta.url), 'utf8'),
  };
}
