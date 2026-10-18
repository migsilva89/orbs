import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { createRegistry, Harness } from '@earendil-works/pi-durable';
import { CodingTools } from '@earendil-works/pi-durable/tools';
import { collaborationExtension } from '../collaboration/collaboration.extension';
import { makeConversationIndexService } from '../conversation-index/conversation-index.service';
import { subagentExtension } from '../subagent/subagent.service';
import { runtimeActionApprove } from './runtime-action.approve';
import { runtimeActionConfigureBot } from './runtime-action.configure-bot';
import { runtimeActionExecuteCommand } from './runtime-action.execute-command';
import { runtimeActionSubmit } from './runtime-action.submit';
import { runtimeQueryApprovals } from './runtime-query.approvals';
import { runtimeQueryCommands } from './runtime-query.commands';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeQueryHistory } from './runtime-query.history';
import { runtimeQueryModels } from './runtime-query.models';
import { runtimeQuerySubmission } from './runtime-query.submission';
import { runtimeQueryValidateModel } from './runtime-query.validate-model';
import { runtimeQueryWatch } from './runtime-query.watch';
import { runtimeSkills } from './runtime-skills.utils';
import { runtimeToolsExtension } from './runtime-tools.utils';
import type * as RuntimeTypes from '../../types/runtime.types';
import type { CommandExecuteInput } from '@openbots/contracts/universal';

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
  const trustedReads = [...readOnlyTools, ...collaboration.readOnlyTools];
  const extensions = [CodingTools, runtimeSkills, collaboration.extension, subagentExtension(), ...toolExtensions];

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
      executeCommand: (params: CommandExecuteInput, context = BACKGROUND_CONTEXT) => (
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
      stop: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryConversation(deps, params, context).then((conversation) => conversation.abort(context))
      ),
    },
    queries: {
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
    watch: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
      runtimeQueryWatch(deps, params, context)
    ),
    resume: () => harness.resume(),
    closed: harness.closed,
    close: () => harness.close(BACKGROUND_CONTEXT),
  };
}

export type RuntimeService = Awaited<ReturnType<typeof makeRuntimeService>>;
