import { conversationQuerySettings } from './conversation-query.settings';
import { CONVERSATION } from './conversation.constants';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationConfigureInput } from '@openbots/contracts/universal';

export async function conversationActionConfigure(deps: ConversationServiceDeps, { whenBusy, hideVerbose }: ConversationConfigureInput) {
  await deps.settings.actions.set({
    records: [
      ...(whenBusy ? [{ key: CONVERSATION.whenBusySetting, value: whenBusy }] : []),
      ...(hideVerbose === undefined ? [] : [{ key: CONVERSATION.hideVerboseSetting, value: String(hideVerbose) }]),
    ],
  });

  return conversationQuerySettings(deps);
}
