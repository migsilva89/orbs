import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ArtifactUpdateInput } from '@repo/contracts/universal';

export async function runtimeActionUpdateArtifact(deps: RuntimeServiceDeps, { context, ...params }: ArtifactUpdateInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { ...params, context });
  return deps.artifacts.actions.update({ ...params, conversationId: conversation.id }, context);
}
