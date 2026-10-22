import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactUpdateInput } from '@repo/contracts/universal';

export async function runtimeActionUpdateArtifact(deps: RuntimeServiceDeps, params: ArtifactUpdateInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  return deps.artifacts.actions.update({ ...params, conversationId: conversation.id }, context);
}
