import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ArtifactSaveStateInput } from '@repo/contracts/universal';

export async function runtimeActionSaveArtifactState(deps: RuntimeServiceDeps, { context, ...params }: ArtifactSaveStateInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { ...params, context });
  return deps.artifacts.actions.saveState({ ...params, conversationId: conversation.id }, context);
}
