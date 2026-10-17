import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { createRegistry, Harness } from '@earendil-works/pi-durable';
import { CodingTools } from '@earendil-works/pi-durable/tools';
import { runtimeActionApprove } from './runtime-action.approve';
import { runtimeActionConfigureBot } from './runtime-action.configure-bot';
import { runtimeActionSubmit } from './runtime-action.submit';
import { runtimeQueryApprovals } from './runtime-query.approvals';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeQueryHistory } from './runtime-query.history';
import { runtimeQueryModels } from './runtime-query.models';
import { runtimeQueryValidateModel } from './runtime-query.validate-model';
import { runtimeSkills } from './runtime-skills.utils';
import { runtimeToolsExtension } from './runtime-tools.utils';
import type * as RuntimeTypes from '../../types/runtime.types';

export async function makeRuntimeService({
  storage,
  models,
  env,
  permissions,
  toolExtensions = [],
  readOnlyTools = CodingTools.tools?.filter((tool) => tool.name === 'read') ?? [],
}: RuntimeTypes.RuntimeServiceParams) {
  const registry = createRegistry();
  const extensions = [CodingTools, runtimeSkills, ...toolExtensions];

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
    readOnlyTools,
    permissions,
  });

  registry.install(permissionExtension);

  const deps = {
    harness,
    models,
    readOnlyTools,
    extensions: [...extensions, permissionExtension],
  };

  return {
    actions: {
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
      approvals: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryApprovals(deps, params, context)
      ),
      models: () => runtimeQueryModels(deps),
      validateModel: (params: RuntimeTypes.RuntimeModelParams) => runtimeQueryValidateModel(deps, params),
      history: (params: RuntimeTypes.RuntimeHistoryParams, context = BACKGROUND_CONTEXT) => (
        runtimeQueryHistory(deps, params, context)
      ),
    },
    watch: (params: RuntimeTypes.RuntimeConversationParams, context = BACKGROUND_CONTEXT) => (
      runtimeQueryConversation(deps, params, context).then((conversation) => conversation.watch(context))
    ),
    resume: () => harness.resume(),
    closed: harness.closed,
    close: () => harness.close(BACKGROUND_CONTEXT),
  };
}

export type RuntimeService = Awaited<ReturnType<typeof makeRuntimeService>>;
