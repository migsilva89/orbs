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
    '0003_bots': readFileSync(new URL('./migrations/0003_bots.sql', import.meta.url), 'utf8'),
    '0004_bot_preferences': readFileSync(new URL('./migrations/0004_bot_preferences.sql', import.meta.url), 'utf8'),
    '0005_credentials': readFileSync(new URL('./migrations/0005_credentials.sql', import.meta.url), 'utf8'),
    '0006_settings': readFileSync(new URL('./migrations/0006_settings.sql', import.meta.url), 'utf8'),
    '0007_settings_keys': readFileSync(new URL('./migrations/0007_settings_keys.sql', import.meta.url), 'utf8'),
    '0008_bot_fallback': readFileSync(new URL('./migrations/0008_bot_fallback.sql', import.meta.url), 'utf8'),
    '0009_bot_preference': readFileSync(new URL('./migrations/0009_bot_preference.sql', import.meta.url), 'utf8'),
    '0010_bot_preference_when_busy': readFileSync(new URL('./migrations/0010_bot_preference_when_busy.sql', import.meta.url), 'utf8'),
    '0011_device_push_token': readFileSync(new URL('./migrations/0011_device_push_token.sql', import.meta.url), 'utf8'),
    '0012_device_push_url': readFileSync(new URL('./migrations/0012_device_push_url.sql', import.meta.url), 'utf8'),
    '0013_pairing_pin': readFileSync(new URL('./migrations/0013_pairing_pin.sql', import.meta.url), 'utf8'),
  };
}
