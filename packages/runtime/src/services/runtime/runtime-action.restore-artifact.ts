import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ArtifactRestoreInput } from '@repo/contracts/universal';

export async function runtimeActionRestoreArtifact(deps: RuntimeServiceDeps, params: ArtifactRestoreInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  return deps.artifacts.actions.restore({ ...params, conversationId: conversation.id }, context);
}
