import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactCreateInput } from '@repo/contracts/universal';

export async function runtimeActionCreateArtifact(deps: RuntimeServiceDeps, params: ArtifactCreateInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  return deps.artifacts.actions.create({ ...params, conversationId: conversation.id }, context);
}
