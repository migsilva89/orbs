import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ArtifactCreateInput } from '@repo/contracts/universal';

export async function runtimeActionCreateArtifact(deps: RuntimeServiceDeps, { context, ...params }: ArtifactCreateInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { ...params, context });
  return deps.artifacts.actions.create({ ...params, conversationId: conversation.id }, context);
}
