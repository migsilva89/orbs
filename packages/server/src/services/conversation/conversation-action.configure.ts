import { conversationQuerySettings } from './conversation-query.settings';
import { CONVERSATION } from './conversation.constants';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationConfigureInput } from '@openbots/contracts/universal';

export async function conversationActionConfigure(deps: ConversationServiceDeps, { whenBusy }: ConversationConfigureInput) {
  await deps.settings.actions.set({
    records: whenBusy ? [{ key: CONVERSATION.whenBusySetting, value: whenBusy }] : [],
  });

  return conversationQuerySettings(deps);
}
