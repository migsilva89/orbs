import { conversationWhenBusy } from '@openbots/contracts/universal';
import { CONVERSATION } from './conversation.constants';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSettings } from '@openbots/contracts/universal';

export async function conversationQuerySettings({ settings }: ConversationServiceDeps): Promise<ConversationSettings> {
  const stored = await settings.queries.get({ keys: [CONVERSATION.whenBusySetting] });

  return { whenBusy: conversationWhenBusy.catch('followUp').parse(stored.at(0)?.value) };
}
