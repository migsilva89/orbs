import { match, P } from 'ts-pattern';
import { collaborationPrivateContext } from '../collaboration/collaboration.constants';
import { subagentAgents } from '../subagent/subagent.constants';
import { runtimeBot } from './runtime.constants';
import type { CollaborationPrivateLinks } from '../../types/collaboration.types';
import type { RuntimeContextParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationId } from '@earendil-works/pi-durable';
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

export async function runtimeContextPrivateItem(
  { botId, directory }: RuntimeServiceDeps,
  link: CollaborationPrivateLinks['links'][number],
  context: Context,
): Promise<ConversationContextItem | undefined> {
  const recipient = await directory.harness(link.recipientId).catch(() => null);

  return match(recipient)
    .with(P.nonNullable, async (harness) => {
      const metadata = await harness.snapshot(collaborationPrivateContext, link.conversationId, context);
      const graph = await harness.taskGraph(context);

      try {
        const isRunning = Object.values(graph.value.tasks)
          .some((task) => task.conversationId === link.conversationId && !task.abortRequested && !task.background);

        return match({ ...metadata })
          .with({
            senderId: botId,
            recipientId: P.string,
            createdAt: P.number,
          }, (value) => ({
            kind: 'private' as const,
            botId: value.recipientId,
            conversationId: link.conversationId,
            createdAt: value.createdAt,
            isRunning,
          }))
          .otherwise(() => undefined);
      } finally {
        graph.dispose();
      }
    })
    .otherwise(() => undefined);
}

export async function runtimeContextPrivateWith({ harness }: Pick<RuntimeServiceDeps, 'harness'>, botId: string, conversationId: ConversationId, context: Context) {
  const metadata = await harness.snapshot(collaborationPrivateContext, conversationId, context);

  return match(metadata)
    .with({ recipientId: botId, senderId: P.string }, ({ senderId }) => senderId)
    .otherwise(() => null);
}
