import { conversationWhenBusy } from '@openbots/contracts/universal';
import { CONVERSATION } from './conversation.constants';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSettings } from '@openbots/contracts/universal';

export async function conversationQuerySettings({ settings }: ConversationServiceDeps): Promise<ConversationSettings> {
  const records = await settings.queries.get({ keys: [CONVERSATION.whenBusySetting, CONVERSATION.hideVerboseSetting] });
  const stored = new Map(records.map((record) => [record.key, record.value]));

  return {
    whenBusy: conversationWhenBusy.catch('followUp').parse(stored.get(CONVERSATION.whenBusySetting)),
    hideVerbose: stored.get(CONVERSATION.hideVerboseSetting) !== 'false',
  };
}
