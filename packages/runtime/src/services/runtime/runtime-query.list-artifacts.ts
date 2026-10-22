import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactListInput } from '@repo/contracts/universal';

export async function runtimeQueryListArtifacts(deps: RuntimeServiceDeps, params: ArtifactListInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  return deps.artifacts.queries.list({ ...params, conversationId: conversation.id }, context);
}
