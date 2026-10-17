import { conversationActionSubmit } from './conversation-action.submit';
import { conversationQueryWatch } from './conversation-query.watch';
import type { ConversationServiceDeps, ConversationWatchParams } from '../../types/conversation.types';
import type { ConversationSubmitInput } from '@openbots/contracts/universal';

export function makeConversationService(deps: ConversationServiceDeps) {
  return {
    actions: {
      submit: (params: ConversationSubmitInput) => conversationActionSubmit(deps, params),
      stop: () => deps.runtime.actions.stop(),
    },
    watch: (params: ConversationWatchParams) => conversationQueryWatch(deps, params),
  };
}

export type ConversationService = ReturnType<typeof makeConversationService>;
