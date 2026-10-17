import { botRecord } from './bot.utils';
import type { BotDatabaseDeps } from '../../types/bot.types';

export async function botQueryList({ database }: BotDatabaseDeps) {
  const rows = await database.db.selectFrom('bot').selectAll().orderBy('createdAt').orderBy('id').execute();

  return rows.map(botRecord);
}
