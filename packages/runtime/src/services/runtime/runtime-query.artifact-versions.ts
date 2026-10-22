import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactVersionsInput } from '@repo/contracts/universal';

export async function runtimeQueryArtifactVersions(deps: RuntimeServiceDeps, params: ArtifactVersionsInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  return deps.artifacts.queries.versions({ ...params, conversationId: conversation.id }, context);
}
