import { match, P } from 'ts-pattern';
import { collaborationTemporaryContext } from '../collaboration/collaboration.constants';
import { subagentAgents } from '../subagent/subagent.constants';
import { runtimeBot } from './runtime.constants';
import type { CollaborationTemporaryLinks } from '../../types/collaboration.types';
import type { RuntimeContextParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationContextItem } from '@repo/contracts/universal';

export async function runtimeContextItem(
  { harness }: RuntimeServiceDeps,
  { record, sourceConversationId, isRunning }: RuntimeContextParams,
  context: Context,
): Promise<ConversationContextItem | undefined> {
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
}

export async function runtimeContextTemporaryItem(
  { botId, directory }: RuntimeServiceDeps,
  link: CollaborationTemporaryLinks['links'][number],
  sourceConversationId: number,
  context: Context,
): Promise<ConversationContextItem | undefined> {
  const recipient = await directory.harness(link.recipientId).catch(() => null);

  return match(recipient)
    .with(P.nonNullable, async (harness) => {
      const metadata = await harness.snapshot(collaborationTemporaryContext, link.conversationId, context);
      const graph = await harness.taskGraph(context);

      try {
        const isRunning = Object.values(graph.value.tasks)
          .some((task) => task.conversationId === link.conversationId && !task.abortRequested && !task.background);

        return match({ ...metadata })
          .with({
            senderId: botId,
            sourceConversationId,
            recipientId: P.string,
            createdAt: P.number,
            expiresAt: P.number,
          }, (value) => ({
            kind: 'temporary' as const,
            botId: value.recipientId,
            conversationId: link.conversationId,
            createdAt: value.createdAt,
            expiresAt: value.expiresAt,
            archivedAt: metadata?.archivedAt ?? null,
            isRunning,
          }))
          .otherwise(() => undefined);
      } finally {
        graph.dispose();
      }
    })
    .otherwise(() => undefined);
}
