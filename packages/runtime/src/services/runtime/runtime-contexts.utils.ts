import { match, P } from 'ts-pattern';
import { collaborationTemporaryContext } from '../collaboration/collaboration.constants';
import { subagentAgents } from '../subagent/subagent.constants';
import { runtimeBot } from './runtime.constants';
import type { RuntimeContextParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationContextItem } from '@openbots/contracts/universal';

export async function runtimeContextItem(
  { harness }: RuntimeServiceDeps,
  { record, sourceConversationId, kind, isRunning }: RuntimeContextParams,
  context: Context,
): Promise<ConversationContextItem | undefined> {
  return match(kind)
    .with('subagent', async () => {
      const identity = await harness.snapshot(runtimeBot, record.id, context);
      const agents = await harness.snapshot(subagentAgents, sourceConversationId, context);

      return match({ owner: record.owner, botId: identity?.botId })
        .with({ owner: { conversationId: sourceConversationId }, botId: P.string }, async ({ owner, botId }) => {
          const task = await harness.getTask(owner.taskId, context);

          return {
            kind: 'subagent' as const,
            botId,
            conversationId: record.id,
            name: Object.entries(agents?.agents ?? {}).find(([, agent]) => agent.conversationId === record.id)?.[0] ?? null,
            ownerTaskId: owner.taskId,
            isBackground: task?.background ?? false,
            isRunning,
          };
        })
        .otherwise(() => undefined);
    })
    .with('temporary', async () => {
      const metadata = await harness.snapshot(collaborationTemporaryContext, record.id, context);

      return match({ ...metadata })
        .with({
          sourceConversationId,
          recipientId: P.string,
          createdAt: P.number,
          expiresAt: P.number,
        }, (value) => ({
          kind: 'temporary' as const,
          botId: value.recipientId,
          conversationId: record.id,
          createdAt: value.createdAt,
          expiresAt: value.expiresAt,
          archivedAt: metadata?.archivedAt ?? null,
          isRunning,
        }))
        .otherwise(() => undefined);
    })
    .exhaustive();
}
