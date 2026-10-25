import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ArtifactRestoreInput } from '@repo/contracts/universal';

export async function runtimeActionRestoreArtifact(deps: RuntimeServiceDeps, { context, ...params }: ArtifactRestoreInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { ...params, context });
  return deps.artifacts.actions.restore({ ...params, conversationId: conversation.id }, context);
}
