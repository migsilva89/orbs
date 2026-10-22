import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function conversationActionClear({ bots, attachments }: ConversationServiceDeps, { botId }: BotGetInput) {
  await bots.actions.clearHistory({ botId });
  await attachments.actions.clear({ botId });
  await bots.actions.setPreferences({ botId, readThroughEntryId: 0 });
}
