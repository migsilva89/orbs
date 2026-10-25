import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ArtifactListInput } from '@repo/contracts/universal';

export async function runtimeQueryListArtifacts(deps: RuntimeServiceDeps, { context, ...params }: ArtifactListInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { ...params, context });
  return deps.artifacts.queries.list({ ...params, conversationId: conversation.id }, context);
}
