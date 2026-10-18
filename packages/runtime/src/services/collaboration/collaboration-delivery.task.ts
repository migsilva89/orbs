import { ConversationBusy, defineTask } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from './collaboration.constants';
import { collaborationAnswer } from './collaboration.utils';
import type { CollaborationDeliveryInput, CollaborationDeliveryState, CollaborationResult } from '../../types/collaboration.types';

export const collaborationDelivery = defineTask<CollaborationDeliveryInput, CollaborationDeliveryState, CollaborationResult>({
  name: COLLABORATION.delivery,
  version: 1,
  initial: () => ({ phase: 'deliver' }),
  phases: {
    deliver: async (task, api, context) => {
      const input = task.input;
      const recipient = await api.conversation(input.recipientConversationId, context);
      const whenBusy = match(input.mode).with('ask', () => 'reject' as const).with('send', () => 'followUp' as const).exhaustive();

      const result = await match(recipient)
        .with(P.nonNullable, async (conversation): Promise<CollaborationResult> => {
          try {
            const submission = await conversation.submit({
              type: 'input',
              content: `[Private message from ${input.senderName}. Answer this request; do not delegate it to another bot.]\n\n${input.message}`,
              requestId: `openbots.delivery:${task.id}`,
              whenBusy,
              entry: { kind: COLLABORATION.message,
                data: {
                  fromBotId: input.senderId,
                  toBotId: input.recipientId,
                  deliveryId: task.id,
                } },
            }, context);

            const settled = await submission.wait(context);

            return match(settled)
              .with({ status: 'done', type: 'input' }, ({ answer }) => ({ status: 'answered' as const, answerId: answer }))
              .with({ status: 'unanswered' }, ({ reason }) => ({ status: 'unanswered' as const, reason }))
              .otherwise(() => ({ status: 'unanswered' as const, reason: 'No answer was produced.' }));
          } catch (error) {
            return match(error)
              .with(P.instanceOf(ConversationBusy), () => ({ status: 'unanswered' as const, reason: 'Recipient is busy; use message_bot to queue work.' }))
              .otherwise((cause) => {
                throw cause;
              });
          }
        })
        .otherwise(() => ({ status: 'unanswered' as const, reason: 'Recipient conversation is unavailable.' }));

      await api.commit(async (tx) => match(input.mode)
        .with('ask', () => ({ status: 'terminal' as const, outcome: { status: 'completed' as const, result } }))
        .with('send', async () => {
          const report = await match(result)
            .with({ status: 'answered' }, ({ answerId }) => collaborationAnswer(tx, answerId))
            .with({ status: 'unanswered', reason: 'aborted' }, () => null)
            .with({ status: 'unanswered' }, ({ reason }) => `Delivery failed: ${reason}`)
            .exhaustive();

          return { status: 'running' as const, checkpoint: { phase: 'report' as const, result, report } };
        })
        .exhaustive(), context);
    },
    report: async (task, api, context) => {
      const { result, report: text } = task.state.checkpoint;

      const requestId = match(result)
        .with({ status: 'answered' }, ({ answerId }) => `openbots.reply:${task.input.recipientConversationId}:${answerId}`)
        .with({ status: 'unanswered' }, () => `openbots.reply:${task.id}`)
        .exhaustive();

      await match(text)
        .with(P.string, async (answer) => {
          const sender = await api.conversation(api.conversationId, context);
          await sender?.submit({
            type: 'input',
            content: `[${task.input.recipientName} replied. No reply or further delegation is needed.]\n\n${answer}`,
            whenBusy: 'followUp',
            requestId,
            entry: { kind: COLLABORATION.reply,
              data: {
                fromBotId: task.input.recipientId,
                toBotId: task.input.senderId,
                deliveryId: task.id,
                result,
              } },
          }, context);
        })
        .otherwise(() => undefined);

      await api.commit(() => ({ status: 'terminal', outcome: { status: 'completed', result } }), context);
    },
  },
  abort: (_task, api, context) => api.commit(() => ({ status: 'terminal', outcome: { status: 'aborted' } }), context),
});
