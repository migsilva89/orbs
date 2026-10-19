import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { createToolSearchExtension } from '@earendil-works/pi-durable/tool-search';
import { CodingTools } from '@earendil-works/pi-durable/tools';
import { log } from '@openbots/logger/server';
import { match, P } from 'ts-pattern';
import { artifactBlocksCatalog } from '../artifact/artifact-blocks.utils';
import { collaborationExtension } from '../collaboration/collaboration.extension';
import { notificationItemKey, notificationRecentAppend } from '../notification/notification.utils';
import { questionExtension } from '../question/question.service';
import { routineExtension } from '../routine/routine.service';
import { subagentExtension } from '../subagent/subagent.service';
import { runtimeActionAddAttachment } from './runtime-action.add-attachment';
import { runtimeActionAnswerQuestion } from './runtime-action.answer-question';
import { runtimeActionApprove } from './runtime-action.approve';
import { runtimeActionCarryOver } from './runtime-action.carry-over';
import { runtimeActionConfigureBot } from './runtime-action.configure-bot';
import { runtimeActionCreateArtifact } from './runtime-action.create-artifact';
import { runtimeActionCreateRoutine } from './runtime-action.create-routine';
import { runtimeActionExecuteCommand } from './runtime-action.execute-command';
import { runtimeActionExpireAttachments } from './runtime-action.expire-attachments';
import { runtimeActionRegisterBotTools } from './runtime-action.register-bot-tools';
import { runtimeActionRemoveAttachment } from './runtime-action.remove-attachment';
import { runtimeActionRemoveRoutine } from './runtime-action.remove-routine';
import { runtimeActionRestoreArtifact } from './runtime-action.restore-artifact';
import { runtimeActionRetainAttachments } from './runtime-action.retain-attachments';
import { runtimeActionRunRoutine } from './runtime-action.run-routine';
import { runtimeActionSaveArtifactState } from './runtime-action.save-artifact-state';
import { runtimeActionSetReaction } from './runtime-action.set-reaction';
import { runtimeActionSubmit } from './runtime-action.submit';
import { runtimeActionUpdateArtifact } from './runtime-action.update-artifact';
import { runtimeActionUpdateRoutine } from './runtime-action.update-routine';
import { runtimeActionUpdateSubmission } from './runtime-action.update-submission';
import { runtimeBotOpen } from './runtime-bot.utils';
import { runtimeChatToolsExtension } from './runtime-chat-tools.utils';
import { runtimeDirectory } from './runtime-directory.utils';
import { runtimeModels } from './runtime-models.utils';
import { runtimeQueryApprovals } from './runtime-query.approvals';
import { runtimeQueryArtifact } from './runtime-query.artifact';
import { runtimeQueryArtifactVersions } from './runtime-query.artifact-versions';
import { runtimeQueryAttachment } from './runtime-query.attachment';
import { runtimeQueryAttachmentTarget } from './runtime-query.attachment-target';
import { runtimeQueryAttachments } from './runtime-query.attachments';
import { runtimeQueryCarry } from './runtime-query.carry';
import { runtimeQueryCommands } from './runtime-query.commands';
import { runtimeQueryContextUsage } from './runtime-query.context-usage';
import { runtimeQueryContexts } from './runtime-query.contexts';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeQueryHasEntry } from './runtime-query.has-entry';
import { runtimeQueryHistory } from './runtime-query.history';
import { runtimeQueryListArtifacts } from './runtime-query.list-artifacts';
import { runtimeQueryListRoutines } from './runtime-query.list-routines';
import { runtimeQueryModels } from './runtime-query.models';
import { runtimeQueryQuestions } from './runtime-query.questions';
import { runtimeQueryReactions } from './runtime-query.reactions';
import { runtimeQuerySearch } from './runtime-query.search';
import { runtimeQuerySubmission } from './runtime-query.submission';
import { runtimeQueryUsage } from './runtime-query.usage';
import { runtimeQueryValidateModel } from './runtime-query.validate-model';
import { runtimeQueryWatch } from './runtime-query.watch';
import { runtimeQueryWatchContexts } from './runtime-query.watch-contexts';
import { runtimeSkills } from './runtime-skills.utils';
import { runtimeWatchMerge } from './runtime-watch-merge.utils';
import { RUNTIME_ALARM_HEARTBEAT_MS } from './runtime.constants';
import type * as AttachmentTypes from '../../types/attachment.types';
import type { ConversationIndexSummary } from '../../types/conversation-index.types';
import type { RuntimeSearchParams } from '../../types/history.types';
import type { RuntimeRegisterBotToolsParams } from '../../types/runtime-bot-tools.types';
import type * as RuntimeTypes from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type * as UniversalTypes from '@openbots/contracts/universal';

export async function makeRuntimeService({
  storage,
  alarm,
  models: sourceModels,
  env,
  permissions,
  collaboration: policy,
  toolExtensions = [],
  readOnlyTools = CodingTools.tools?.filter((tool) => tool.name === 'read') ?? [],
}: RuntimeTypes.RuntimeServiceParams) {
  const directory = runtimeDirectory({ open: (botId) => runtimeBotOpen(shared, botId) });
  const collaboration = collaborationExtension({ policy, directory });
  const questions = questionExtension();
  const chatTools = runtimeChatToolsExtension();
  const toolSearch = createToolSearchExtension();

  // One model limiter and one extension list for every bot store.
  const shared: RuntimeTypes.RuntimeSharedDeps = {
    storage,
    alarm,
    models: runtimeModels(sourceModels),
    env,
    permissions,
    directory,
    extensions: [
      CodingTools,
      runtimeSkills,
      collaboration.extension,
      questions.extension,
      chatTools.extension,
      subagentExtension(),
      routineExtension,
      toolSearch,
      ...toolExtensions,
    ],
    readOnlyTools: [
      ...readOnlyTools,
      ...collaboration.readOnlyTools,
      ...questions.readOnlyTools,
      ...chatTools.readOnlyTools,
      ...(toolSearch.tools ?? []),
    ],
  };

  // An alarm reopens a bot whose store closed, so its routines and deadlines still run.
  const unlisten = alarm.listen(({ botId }) => {
    void directory.bot(botId).then((bot) => bot.wake()).catch((error: unknown) => {
      log.error({
        tag: 'runtime-alarm',
        message: 'Cannot wake a bot store.',
        botId,
        error,
      });
    });
  });

  const unlistenFailures = directory.onChange((change) => match(change)
    .with({ type: 'closed', isFailed: true }, ({ botId }) => alarm.set({ botId, at: Date.now() + RUNTIME_ALARM_HEARTBEAT_MS }))
    .otherwise(() => undefined));

  const inBot = <P extends { botId: string }, R>(run: (deps: RuntimeTypes.RuntimeServiceDeps, params: P, context: Context) => Promise<R> | R) => (
    async (params: P, context: Context = BACKGROUND_CONTEXT) => run((await directory.bot(params.botId)).deps, params, context)
  );

  const configureBot = async (bot: RuntimeTypes.RuntimeBotParams, context: Context = BACKGROUND_CONTEXT) => {
    directory.register(bot.id);
    const { deps } = await directory.bot(bot.id);
    const conversationId = await runtimeActionConfigureBot(deps, bot, context);
    await runtimeActionCarryOver({ ...deps, storage }, { conversationId }, context);

    return conversationId;
  };

  return {
    actions: {
      restoreArtifact: inBot(runtimeActionRestoreArtifact),
      saveArtifactState: inBot(runtimeActionSaveArtifactState),
      updateArtifact: inBot(runtimeActionUpdateArtifact),
      createArtifact: inBot(runtimeActionCreateArtifact),
      registerBotTools: (params: RuntimeRegisterBotToolsParams) => runtimeActionRegisterBotTools(shared, params),
      removeRoutine: inBot(runtimeActionRemoveRoutine),
      runRoutine: inBot(runtimeActionRunRoutine),
      updateRoutine: inBot(runtimeActionUpdateRoutine),
      createRoutine: inBot(runtimeActionCreateRoutine),
      answerQuestion: inBot(runtimeActionAnswerQuestion),
      setReaction: inBot(runtimeActionSetReaction),
      executeCommand: inBot(runtimeActionExecuteCommand),
      approve: inBot(runtimeActionApprove),
      configureBot,
      /** Close the bot's store and delete it. Pi has no delete API; the store file is the unit of erasure. */
      removeBot: async ({ botId }: UniversalTypes.BotGetInput) => {
        directory.unregister(botId);
        await directory.close(botId, () => storage.remove({ botId }));
      },
      /** Save routines and artifacts, then delete the bot's store. The next `configureBot` opens a fresh one and refills it. */
      clearBot: async ({ botId }: UniversalTypes.BotGetInput, context: Context = BACKGROUND_CONTEXT) => {
        const { deps } = await directory.bot(botId);
        await storage.saveCarry({ botId, carry: await runtimeQueryCarry(deps, context) });
        await directory.close(botId, () => storage.reset({ botId }));
      },
      submit: inBot(runtimeActionSubmit),
      updateSubmission: inBot(runtimeActionUpdateSubmission),
      addAttachment: inBot(runtimeActionAddAttachment),
      removeAttachment: inBot(runtimeActionRemoveAttachment),
      retainAttachments: inBot(runtimeActionRetainAttachments),
      expireAttachments: inBot(runtimeActionExpireAttachments),
      stop: inBot((deps, params: RuntimeTypes.RuntimeConversationParams, context) => (
        runtimeQueryConversation(deps, params, context).then((conversation) => conversation.abort(context))
      )),
    },
    queries: {
      artifactBlocks: () => artifactBlocksCatalog(),
      artifactVersions: inBot(runtimeQueryArtifactVersions),
      artifact: inBot(runtimeQueryArtifact),
      artifacts: inBot(runtimeQueryListArtifacts),
      search: inBot((deps, params: RuntimeSearchParams, context) => runtimeQuerySearch(deps, params, context)),
      routines: inBot(runtimeQueryListRoutines),
      questions: inBot(runtimeQueryQuestions),
      reactions: inBot(runtimeQueryReactions),
      attachment: inBot((deps, params: AttachmentTypes.RuntimeAttachmentIdParams, context) => runtimeQueryAttachment(deps, params, context)),
      attachments: inBot((deps, params: AttachmentTypes.RuntimeAttachmentsQueryParams, context) => runtimeQueryAttachments(deps, params, context)),
      attachmentTarget: inBot(runtimeQueryAttachmentTarget),
      contextUsage: inBot(runtimeQueryContextUsage),
      usage: inBot(runtimeQueryUsage),
      contexts: inBot(runtimeQueryContexts),
      hasEntry: inBot(runtimeQueryHasEntry),
      conversations: async (context: Context = BACKGROUND_CONTEXT): Promise<ConversationIndexSummary[]> => {
        const lists = await Promise.all(directory.opened().map((bot) => bot.deps.index.queries.list(context)));
        return lists.flat();
      },
      submission: inBot(runtimeQuerySubmission),
      commands: () => runtimeQueryCommands(),
      approvals: inBot(runtimeQueryApprovals),
      models: () => runtimeQueryModels(shared),
      validateModel: (params: RuntimeTypes.RuntimeModelParams) => runtimeQueryValidateModel(shared, params),
      history: inBot(runtimeQueryHistory),
    },
    watchConversations: (context: Context = BACKGROUND_CONTEXT) => {
      const lists = new Map<string, ConversationIndexSummary[]>();

      return runtimeWatchMerge<{ conversations: ConversationIndexSummary[] }, { conversations: ConversationIndexSummary[] }>({
        directory,
        initial: { conversations: [] },
        attach: (bot, watchContext) => bot.deps.index.watch(watchContext),
        apply: (draft, botId, value) => {
          match(value)
            .with(P.nonNullable, ({ conversations }) => lists.set(botId, conversations))
            .otherwise(() => lists.delete(botId));
          draft.conversations = [...lists.values()].flat();
        },
        context,
      });
    },
    watchNotifications: (context: Context = BACKGROUND_CONTEXT) => {
      const pending = new Map<string, UniversalTypes.NotificationItem[]>();
      const recent = new Map<string, UniversalTypes.NotificationItem[]>();
      const seen = new Set<string>();

      return runtimeWatchMerge<UniversalTypes.NotificationState, UniversalTypes.NotificationState>({
        directory,
        initial: { pending: [], recent: [] },
        attach: (bot, watchContext) => bot.notifications.watch(watchContext),
        apply: (draft, botId, value) => {
          match(value)
            .with(P.nonNullable, (state) => {
              pending.set(botId, state.pending);
              recent.set(botId, state.recent);

              for (const item of state.recent) {
                const key = notificationItemKey(item);

                match(seen.has(key))
                  .with(true, () => undefined)
                  .with(false, () => {
                    seen.add(key);
                    draft.recent = notificationRecentAppend(draft.recent, item);
                  })
                  .exhaustive();
              }
            })
            .otherwise(() => {
              pending.delete(botId);
              recent.delete(botId);
            });
          draft.pending = [...pending.values()].flat();
          // Remember only items still visible somewhere, so the set stays as small as the recent windows.
          const visible = [...draft.recent, ...[...recent.values()].flat()].map(notificationItemKey);
          seen.clear();

          for (const key of visible) {
            seen.add(key);
          }
        },
        context,
      });
    },
    watchContexts: inBot(runtimeQueryWatchContexts),
    watch: inBot(runtimeQueryWatch),
    resume: () => {
      for (const bot of directory.opened()) {
        bot.wake();
      }
    },
    close: async () => {
      unlisten();
      unlistenFailures();
      await directory.closeAll();
    },
  };
}

export type RuntimeService = Awaited<ReturnType<typeof makeRuntimeService>>;
