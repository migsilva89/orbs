import { conversationActionAnswerQuestion } from './conversation-action.answer-question';
import { conversationActionApprove } from './conversation-action.approve';
import { conversationActionArrange } from './conversation-action.arrange';
import { conversationActionExecuteCommand } from './conversation-action.execute-command';
import { conversationActionMarkRead } from './conversation-action.mark-read';
import { conversationActionSetHidden } from './conversation-action.set-hidden';
import { conversationActionSetMuted } from './conversation-action.set-muted';
import { conversationActionSetPinned } from './conversation-action.set-pinned';
import { conversationActionSetReaction } from './conversation-action.set-reaction';
import { conversationActionStop } from './conversation-action.stop';
import { conversationActionSubmit } from './conversation-action.submit';
import { conversationActionUpdateSubmission } from './conversation-action.update-submission';
import { conversationQueryApprovals } from './conversation-query.approvals';
import { conversationQueryCommands } from './conversation-query.commands';
import { conversationQueryContextUsage } from './conversation-query.context-usage';
import { conversationQueryContexts } from './conversation-query.contexts';
import { conversationQueryHistory } from './conversation-query.history';
import { conversationQueryList } from './conversation-query.list';
import { conversationQueryQuestions } from './conversation-query.questions';
import { conversationQueryReactions } from './conversation-query.reactions';
import { conversationQuerySearch } from './conversation-query.search';
import { conversationQueryUsage } from './conversation-query.usage';
import { conversationQueryWatch } from './conversation-query.watch';
import { conversationQueryWatchContexts } from './conversation-query.watch-contexts';
import { conversationQueryWatchList } from './conversation-query.watch-list';
import type * as ConversationTypes from '../../types/conversation.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function makeConversationService(deps: ConversationTypes.ConversationServiceDeps) {
  return {
    watchContexts: (params: ConversationTypes.ConversationWatchParams) => conversationQueryWatchContexts(deps, params),
    actions: {
      answerQuestion: (params: ConversationTypes.ConversationAnswerQuestionParams) => conversationActionAnswerQuestion(deps, params),
      setReaction: (params: UniversalTypes.ConversationSetReactionInput) => conversationActionSetReaction(deps, params),
      setHidden: (params: UniversalTypes.ConversationSetHiddenInput) => conversationActionSetHidden(deps, params),
      setMuted: (params: UniversalTypes.ConversationSetMutedInput) => conversationActionSetMuted(deps, params),
      arrange: (params: UniversalTypes.ConversationArrangeInput) => conversationActionArrange(deps, params),

      markRead: (params: UniversalTypes.ConversationMarkReadInput) => conversationActionMarkRead(deps, params),
      setPinned: (params: UniversalTypes.ConversationSetPinnedInput) => conversationActionSetPinned(deps, params),
      executeCommand: (params: UniversalTypes.CommandExecuteInput) => conversationActionExecuteCommand(deps, params),
      approve: (params: ConversationTypes.ConversationApproveParams) => conversationActionApprove(deps, params),
      submit: (params: UniversalTypes.ConversationSubmitInput) => conversationActionSubmit(deps, params),
      updateSubmission: (params: UniversalTypes.ConversationUpdateSubmissionInput) => conversationActionUpdateSubmission(deps, params),
      stop: (params: UniversalTypes.ConversationTarget) => conversationActionStop(deps, params),
    },
    queries: {
      search: (params: UniversalTypes.ConversationSearchInput) => conversationQuerySearch(deps, params),
      questions: (params: UniversalTypes.ConversationTarget) => conversationQueryQuestions(deps, params),
      reactions: (params: UniversalTypes.ConversationReactionsInput) => conversationQueryReactions(deps, params),
      contextUsage: (params: UniversalTypes.ConversationTarget) => conversationQueryContextUsage(deps, params),
      usage: (params: UniversalTypes.ConversationTarget) => conversationQueryUsage(deps, params),
      contexts: (params: UniversalTypes.ConversationContextsInput) => conversationQueryContexts(deps, params),
      list: () => conversationQueryList(deps),
      commands: (params: UniversalTypes.ConversationTarget) => conversationQueryCommands(deps, params),
      approvals: (params: UniversalTypes.ConversationTarget) => conversationQueryApprovals(deps, params),
      history: (params: UniversalTypes.ConversationHistoryInput) => conversationQueryHistory(deps, params),
    },
    watchList: (params: ConversationTypes.ConversationListWatchParams) => conversationQueryWatchList(deps, params),
    watch: (params: ConversationTypes.ConversationWatchParams) => conversationQueryWatch(deps, params),
  };
}

export type ConversationService = ReturnType<typeof makeConversationService>;
