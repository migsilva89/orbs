import { conversationActionApprove } from './conversation-action.approve';
import { conversationActionExecuteCommand } from './conversation-action.execute-command';
import { conversationActionStop } from './conversation-action.stop';
import { conversationActionSubmit } from './conversation-action.submit';
import { conversationQueryApprovals } from './conversation-query.approvals';
import { conversationQueryCommands } from './conversation-query.commands';
import { conversationQueryHistory } from './conversation-query.history';
import { conversationQueryWatch } from './conversation-query.watch';
import type { ConversationApproveParams, ConversationServiceDeps, ConversationWatchParams } from '../../types/conversation.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function makeConversationService(deps: ConversationServiceDeps) {
  return {
    actions: {
      executeCommand: (params: UniversalTypes.CommandExecuteInput) => conversationActionExecuteCommand(deps, params),
      approve: (params: ConversationApproveParams) => conversationActionApprove(deps, params),
      submit: (params: UniversalTypes.ConversationSubmitInput) => conversationActionSubmit(deps, params),
      stop: (params: UniversalTypes.ConversationTarget) => conversationActionStop(deps, params),
    },
    queries: {
      commands: (params: UniversalTypes.ConversationTarget) => conversationQueryCommands(deps, params),
      approvals: (params: UniversalTypes.ConversationTarget) => conversationQueryApprovals(deps, params),
      history: (params: UniversalTypes.ConversationHistoryInput) => conversationQueryHistory(deps, params),
    },
    watch: (params: ConversationWatchParams) => conversationQueryWatch(deps, params),
  };
}

export type ConversationService = ReturnType<typeof makeConversationService>;
