import type { BotDatabaseDeps } from '../../types/bot.types';

export function botQueryList({ database }: BotDatabaseDeps) {
  return database.db.selectFrom('bot').selectAll().orderBy('createdAt').orderBy('id').execute();
}
