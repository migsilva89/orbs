import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ArtifactVersionsInput } from '@repo/contracts/universal';

export async function runtimeQueryArtifactVersions(deps: RuntimeServiceDeps, { context, ...params }: ArtifactVersionsInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { ...params, context });
  return deps.artifacts.queries.versions({ ...params, conversationId: conversation.id }, context);
}
