import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeBotConversations } from '../runtime/runtime.constants';
import { collaborationActionTarget } from './collaboration-action.target';
import { collaborationQueryOrigin } from './collaboration-query.origin';
import { COLLABORATION, collaborationCall } from './collaboration.constants';
import { collaborationAnswer } from './collaboration.utils';
import type { CollaborationSendParams, CollaborationToolDeps } from '../../types/collaboration.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolExecutionApi } from '@earendil-works/pi-durable';

export async function collaborationActionSend(
  deps: CollaborationToolDeps,
  params: CollaborationSendParams,
  api: ToolExecutionApi,
  context: Context,
) {
  const saved = await api.snapshot(collaborationCall, api.taskId, context);

  const deliveryId = await match(saved?.deliveryId)
    .with(P.nonNullable, (id) => id)
    .otherwise(async () => {
      const origin = await collaborationQueryOrigin(api, context);
      const { sender, recipient, maxPending, temporaryTtlMs } = await deps.policy.queries.recipient({ ...origin, recipientId: params.botId });
      const binding = await api.snapshot(runtimeBotConversations, recipient.id, context);

      const mainConversationId = match(binding?.conversationId)
        .with(P.nonNullable, (id) => id)
        .otherwise(() => {
          throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: recipient.id });
        });

      return api.commit(async (tx) => {
        const pages = await Promise.all((['pending', 'running', 'waiting', 'completing'] as const).map((status) => tx.scanTasks({
          conversationId: api.conversationId,
          kind: COLLABORATION.delivery,
          status,
        }, maxPending)));

        const call = await tx.doc(collaborationCall, api.taskId);

        return match(call.deliveryId)
          .with(P.nonNullable, (id) => id)
          .otherwise(async () => {
            match(pages.flatMap((page) => page.items).length >= maxPending)
              .with(true, () => {
                throw new Errors.CONFLICT({ internal: 'Too many pending bot deliveries.' });
              })
              .with(false, () => undefined)
              .exhaustive();

            const ownership = match(params.mode)
              .with('ask', () => ({ ownership: { kind: 'task' as const, taskId: api.taskId } }))
              .with('send', () => ({ ownership: { kind: 'conversation' as const }, background: true }))
              .exhaustive();

            const recipientConversationId = await collaborationActionTarget(tx, {
              sourceConversationId: api.conversationId,
              recipientId: recipient.id,
              mainConversationId,
              context: params.context,
              temporaryTtlMs,
            });

            call.deliveryId = await tx.createTask(deps.delivery, {
              senderId: sender.id,
              senderName: sender.name,
              recipientId: recipient.id,
              recipientName: recipient.name,
              recipientConversationId,
              message: params.message,
              mode: params.mode,
            }, ownership);

            return call.deliveryId;
          });
      }, context);
    });

  const delivery = await api.getTask(deliveryId, context);

  const recipientConversationId = match<unknown>(delivery?.input)
    .with({ recipientConversationId: P.number }, (input) => input.recipientConversationId)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Bot delivery target is unavailable.' });
    });

  const details = { deliveryId, recipientId: params.botId, recipientConversationId };
  await api.details(details, context);

  return match(params.mode)
    .with('send', () => ({ output: [{ type: 'text' as const, text: 'Message accepted. The reply will arrive in this conversation.' }] }))
    .with('ask', async () => {
      const { outcome } = (await api.waitForTask(deliveryId, context)).state;

      return match(outcome)
        .with({ status: 'completed', result: { status: 'answered' } }, async ({ result }) => ({
          output: [{ type: 'text' as const, text: await api.commit((tx) => collaborationAnswer(tx, result.answerId), context) }],
          details: { ...details, answerId: result.answerId },
        }))
        .with({ status: 'completed', result: { status: 'unanswered' } }, ({ result }) => ({
          isError: true,
          output: [{ type: 'text' as const, text: result.reason }],
        }))
        .otherwise(() => ({ isError: true, output: [{ type: 'text' as const, text: 'Bot delivery did not complete.' }] }));
    })
    .exhaustive();
}
