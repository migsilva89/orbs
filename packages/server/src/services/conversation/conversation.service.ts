import { conversationActionApprove } from './conversation-action.approve';
import { conversationActionStop } from './conversation-action.stop';
import { conversationActionSubmit } from './conversation-action.submit';
import { conversationQueryApprovals } from './conversation-query.approvals';
import { conversationQueryHistory } from './conversation-query.history';
import { conversationQueryWatch } from './conversation-query.watch';
import type { ConversationApproveParams, ConversationServiceDeps, ConversationWatchParams } from '../../types/conversation.types';
import type { ConversationHistoryInput, ConversationSubmitInput, ConversationTarget } from '@openbots/contracts/universal';

export function makeConversationService(deps: ConversationServiceDeps) {
  return {
    actions: {
      approve: (params: ConversationApproveParams) => conversationActionApprove(deps, params),
      submit: (params: ConversationSubmitInput) => conversationActionSubmit(deps, params),
      stop: (params: ConversationTarget) => conversationActionStop(deps, params),
    },
    queries: {
      approvals: (params: ConversationTarget) => conversationQueryApprovals(deps, params),
      history: (params: ConversationHistoryInput) => conversationQueryHistory(deps, params),
    },
    watch: (params: ConversationWatchParams) => conversationQueryWatch(deps, params),
  };
}

export type ConversationService = ReturnType<typeof makeConversationService>;
