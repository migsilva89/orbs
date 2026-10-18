import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactSaveStateInput } from '@openbots/contracts/universal';

export async function runtimeActionSaveArtifactState(deps: RuntimeServiceDeps, params: ArtifactSaveStateInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  return deps.artifacts.actions.saveState({ ...params, conversationId: conversation.id }, context);
}
