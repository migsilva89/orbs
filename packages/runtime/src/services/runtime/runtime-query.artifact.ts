import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactGetInput } from '@openbots/contracts/universal';

export async function runtimeQueryArtifact(deps: RuntimeServiceDeps, params: ArtifactGetInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  return deps.artifacts.queries.get({ ...params, conversationId: conversation.id }, context);
}
