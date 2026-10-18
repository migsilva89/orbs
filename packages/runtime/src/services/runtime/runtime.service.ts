import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { createRegistry, Harness } from '@earendil-works/pi-durable';
import { CodingTools } from '@earendil-works/pi-durable/tools';
import { collaborationExtension } from '../collaboration/collaboration.extension';
import { makeConversationIndexService } from '../conversation-index/conversation-index.service';
import { makeQuestionService, questionExtension } from '../question/question.service';
import { makeRoutineService, routineExtension } from '../routine/routine.service';
import { subagentExtension } from '../subagent/subagent.service';
import { runtimeActionAddAttachment } from './runtime-action.add-attachment';
import { runtimeActionAnswerQuestion } from './runtime-action.answer-question';
import { runtimeActionApprove } from './runtime-action.approve';
import { runtimeActionConfigureBot } from './runtime-action.configure-bot';
import { runtimeActionCreateRoutine } from './runtime-action.create-routine';
import { runtimeActionExecuteCommand } from './runtime-action.execute-command';
import { runtimeActionExpireAttachments } from './runtime-action.expire-attachments';
import { runtimeActionRemoveAttachment } from './runtime-action.remove-attachment';
import { runtimeActionRemoveRoutine } from './runtime-action.remove-routine';
import { runtimeActionRetainAttachments } from './runtime-action.retain-attachments';
import { runtimeActionRunRoutine } from './runtime-action.run-routine';
import { runtimeActionSetReaction } from './runtime-action.set-reaction';
import { runtimeActionSubmit } from './runtime-action.submit';
import { runtimeActionUpdateRoutine } from './runtime-action.update-routine';
import { runtimeActionUpdateSubmission } from './runtime-action.update-submission';
import { runtimeQueryApprovals } from './runtime-query.approvals';
import { runtimeQueryAttachment } from './runtime-query.attachment';
import { runtimeQueryAttachmentTarget } from './runtime-query.attachment-target';
import { runtimeQueryAttachments } from './runtime-query.attachments';
import { runtimeQueryCommands } from './runtime-query.commands';
import { runtimeQueryContextUsage } from './runtime-query.context-usage';
import { runtimeQueryContexts } from './runtime-query.contexts';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeQueryHistory } from './runtime-query.history';
import { runtimeQueryListRoutines } from './runtime-query.list-routines';
import { runtimeQueryModels } from './runtime-query.models';
import { runtimeQueryQuestions } from './runtime-query.questions';
import { runtimeQueryReactions } from './runtime-query.reactions';
import { runtimeQuerySubmission } from './runtime-query.submission';
import { runtimeQueryUsage } from './runtime-query.usage';
import { runtimeQueryValidateModel } from './runtime-query.validate-model';
import { runtimeQueryWatch } from './runtime-query.watch';
import { runtimeQueryWatchContexts } from './runtime-query.watch-contexts';
import { runtimeSkills } from './runtime-skills.utils';
import { runtimeToolsExtension } from './runtime-tools.utils';
import type * as AttachmentTypes from '../../types/attachment.types';
import type * as RuntimeTypes from '../../types/runtime.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export async function makeRuntimeService({
  storage,
  models,
  env,
  permissions,
  collaboration: policy,
  toolExtensions = [],
  readOnlyTools = CodingTools.tools?.filter((tool) => tool.name === 'read') ?? [],
}: RuntimeTypes.RuntimeServiceParams) {
  const registry = createRegistry();
  const collaboration = collaborationExtension({ policy });
  const questions = questionExtension();
  const trustedReads = [...readOnlyTools, ...collaboration.readOnlyTools, ...questions.readOnlyTools];
  const extensions = [CodingTools, runtimeSkills, collaboration.extension, questions.extension, subagentExtension(), routineExtension, ...toolExtensions];

  for (const extension of extensions) {
    registry.install(extension);
  }

  const harness = await Harness.open(storage, {
    models,
    registry,
    env,
  }, BACKGROUND_CONTEXT);

  const permissionExtension = runtimeToolsExtension({
    harness,
    readOnlyTools: trustedReads,
    permissions,
  });

  registry.install(permissionExtension);

  const deps = {
    harness,
    questions: makeQuestionService({ harness }),
    routines: makeRoutineService({ harness }),
    index: await makeConversationIndexService({ harness }).catch(async (error: unknown) => {
      await harness.close(BACKGROUND_CONTEXT);
      throw error;
    }),
    registry,
    models,
    readOnlyTools: trustedReads,
    extensions: [...extensions, permissionExtension],
  };

  return {
    actions: {
      removeRoutine: (params: UniversalTypes.RoutineTarget, context = BACKGROUND_CONTEXT) => runtimeActionRemoveRoutine(deps, params, context),
      runRoutine: (params: UniversalTypes.RoutineTarget, context = BACKGROUND_CONTEXT) => runtimeActionRunRoutine(deps, params, context),
      updateRoutine: (params: UniversalTypes.RoutineUpdateInput, context = BACKGROUND_CONTEXT) => runtimeActionUpdateRoutine(deps, params, context),
      createRoutine: (params: UniversalTypes.RoutineCreateInput, context = BACKGROUND_CONTEXT) => runtimeActionCreateRoutine(deps, params, context),
      answerQuestion: (params: RuntimeTypes.RuntimeQuestionAnswer, context = BACKGROUND_CONTEXT) => runtimeActionAnswerQuestion(deps, params, context),
      setReaction: (params: UniversalTypes.ConversationSetReactionInput, context = BACKGROUND_CONTEXT) => runtimeActionSetReaction(deps, params, context),
      setHidden: (params: UniversalTypes.ConversationSetHiddenInput, context = BACKGROUND_CONTEXT) => deps.index.actions.setHidden(params, context),
      setMuted: (params: UniversalTypes.ConversationSetMutedInput, context = BACKGROUND_CONTEXT) => deps.index.actions.setMuted(params, context),
      arrange: (params: UniversalTypes.ConversationArrangeInput, context = BACKGROUND_CONTEXT) => deps.index.actions.arrange(params, context),
      markRead: (params: UniversalTypes.ConversationMarkReadInput, context = BACKGROUND_CONTEXT) => deps.index.actions.markRead(params, context),
      setPinned: (params: UniversalTypes.ConversationSetPinnedInput, context = BACKGROUND_CONTEXT) => deps.index.actions.setPinned(params, context),
      executeCommand: (params: UniversalTypes.CommandExecuteInput, context = BACKGROUND_CONTEXT) => (
        runtimeActionExecuteCommand(deps, params, context)
      ),
      approve: (params: RuntimeTypes.RuntimeApprovalAnswer, context = BACKGROUND_CONTEXT) => (
        runtimeActionApprove(deps, params, context)
      ),
      configureBot: (params: RuntimeTypes.RuntimeBotParams, context = BACKGROUND_CONTEXT) => (
        runtimeActionConfigureBot(deps, params, context)
      ),
      submit: (params: RuntimeTypes.RuntimeSubmitParams, context = BACKGROUND_CONTEXT) => (
        runtimeActionSubmit(deps, params, context)
      ),
      updateSubmission: (params: RuntimeTypes.RuntimeUpdateSubmissionParams, context = BACKGROUND_CONTEXT) => (
        runtimeActionUpdateSubmission(deps, params, context)
      ),
      addAttachment: (params: AttachmentTypes.RuntimeAddAttachmentParams, context = BACKGROUND_CONTEXT) => (
        runtimeActionAddAttachment(deps, params, context)
      ),
      removeAttachment: (params: AttachmentTypes.RuntimeAttachmentIdParams, context = BACKGROUND_CONTEXT) => (
        runtimeActionRemoveAttachment(deps, params, context)
      ),
      retainAttachments: (params: AttachmentTypes.RuntimeRetainAttachmentsParams, context = BACKGROUND_CONTEXT) => (
        runtimeActionRetainAttachments(deps, params, context)
      ),
      expireAttachments: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
        runtimeActionExpireAttachments(deps, params, context)
      ),
      stop: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryConversation(deps, params, context).then((conversation) => conversation.abort(context))
      ),
    },
    queries: {
      routines: (params: UniversalTypes.BotGetInput, context = BACKGROUND_CONTEXT) => runtimeQueryListRoutines(deps, params, context),
      questions: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => runtimeQueryQuestions(deps, params, context),
      reactions: (params: UniversalTypes.ConversationReactionsInput, context = BACKGROUND_CONTEXT) => runtimeQueryReactions(deps, params, context),
      attachment: (params: AttachmentTypes.RuntimeAttachmentIdParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryAttachment(deps, params, context)
      ),
      attachments: (params: AttachmentTypes.RuntimeAttachmentsQueryParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryAttachments(deps, params, context)
      ),
      attachmentTarget: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryAttachmentTarget(deps, params, context)
      ),
      contextUsage: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryContextUsage(deps, params, context)
      ),
      usage: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => runtimeQueryUsage(deps, params, context),
      contexts: (params: UniversalTypes.ConversationContextsInput, context = BACKGROUND_CONTEXT) => runtimeQueryContexts(deps, params, context),
      conversations: (context = BACKGROUND_CONTEXT) => deps.index.queries.list(context),
      submission: (params: RuntimeTypes.RuntimeSubmissionParams, context = BACKGROUND_CONTEXT) => (
        runtimeQuerySubmission(deps, params, context)
      ),
      commands: () => runtimeQueryCommands(),
      approvals: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryApprovals(deps, params, context)
      ),
      models: () => runtimeQueryModels(deps),
      validateModel: (params: RuntimeTypes.RuntimeModelParams) => runtimeQueryValidateModel(deps, params),
      history: (params: RuntimeTypes.RuntimeHistoryParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryHistory(deps, params, context)
      ),
    },
    watchConversations: (context = BACKGROUND_CONTEXT) => deps.index.watch(context),
    watchContexts: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
      runtimeQueryWatchContexts(deps, params, context)
    ),
    watch: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
      runtimeQueryWatch(deps, params, context)
    ),
    resume: () => harness.resume(),
    closed: harness.closed,
    close: () => harness.close(BACKGROUND_CONTEXT),
  };
}

export type RuntimeService = Awaited<ReturnType<typeof makeRuntimeService>>;
