import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ArtifactGetInput } from '@repo/contracts/universal';

export async function runtimeQueryArtifact(deps: RuntimeServiceDeps, { context, ...params }: ArtifactGetInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { ...params, context });
  return deps.artifacts.queries.get({ ...params, conversationId: conversation.id }, context);
}
