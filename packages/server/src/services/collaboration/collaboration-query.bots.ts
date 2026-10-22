import type { CollaborationServiceDeps } from '../../types/collaboration.types';
import type { CollaborationBotParams } from '@repo/runtime/server';

export function collaborationQueryBots({ database }: CollaborationServiceDeps, { botId }: CollaborationBotParams) {
  return database.db.selectFrom('bot')
    .select(['id', 'name', 'handle'])
    .where('id', '!=', botId)
    .orderBy('name')
    .execute();
}
