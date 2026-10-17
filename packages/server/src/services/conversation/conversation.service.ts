import { conversationQueryWatch } from './conversation-query.watch';
import type { ConversationServiceDeps, ConversationWatchParams } from '../../types/conversation.types';

export function makeConversationService(deps: ConversationServiceDeps) {
  return {
    watch: (params: ConversationWatchParams) => conversationQueryWatch(deps, params),
  };
}

export type ConversationService = ReturnType<typeof makeConversationService>;
