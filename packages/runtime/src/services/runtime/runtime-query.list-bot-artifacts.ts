import { ARTIFACT } from '@repo/contracts/universal';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationId, Cursor } from '@earendil-works/pi-durable';
import type { ArtifactBotListInput, ArtifactSummary } from '@repo/contracts/universal';

export async function runtimeQueryListBotArtifacts(deps: RuntimeServiceDeps, params: ArtifactBotListInput, context: Context): Promise<ArtifactSummary[]> {
  async function runtimeConversations(cursor?: Cursor): Promise<ConversationId[]> {
    const page = await deps.harness.commit((tx) => tx.scanConversations({}, ARTIFACT.listLimit, cursor), context);
    const ids = page.items.map((record) => record.id);

    return page.next ? [...ids, ...await runtimeConversations(page.next)] : ids;
  }

  const lists = await Promise.all((await runtimeConversations()).map((conversationId) => (
    deps.artifacts.queries.list({ ...params, conversationId }, context)
  )));

  return lists.flat()
    .sort((left, right) => right.updatedAt - left.updatedAt || left.id.localeCompare(right.id))
    .slice(0, ARTIFACT.listLimit);
}
