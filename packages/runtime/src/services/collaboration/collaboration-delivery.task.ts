import { ConversationBusy, defineTask } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from './collaboration.constants';
import { collaborationAnswer, collaborationFailureNote } from './collaboration.utils';
import type * as CollaborationTypes from '../../types/collaboration.types';
import type { Context } from '@earendil-works/chord/context';
import type { Harness } from '@earendil-works/pi-durable';

/**
 * Lives in the sender's store and submits into the recipient's store. A rerun after a crash submits again with the
 * same request ID; Pi returns the admitted submission, so the recipient sees the message once. The request ID holds
 * the sender's store ID, so task IDs that restart after a history clear never repeat an old delivery.
 */
export function collaborationDeliveryTask({ directory }: Pick<CollaborationTypes.CollaborationDeps, 'directory'>) {
  return defineTask<CollaborationTypes.CollaborationDeliveryInput, CollaborationTypes.CollaborationDeliveryState, CollaborationTypes.CollaborationResult>({
    name: COLLABORATION.delivery,
    version: 1,
    initial: () => ({ phase: 'deliver' }),
    phases: {
      deliver: async (task, api, context) => {
        const input = task.input;
        const store = await directory.harness(input.recipientId).catch(() => null);

        const result = await match(store)
          .with(P.nonNullable, (harness) => collaborationDeliver(harness, task.id, input, context))
          .otherwise(() => ({ status: 'unanswered' as const, reason: 'Recipient bot is unavailable.' }));

        await api.commit(() => match(input.mode)
          .with('ask', () => ({ status: 'terminal' as const, outcome: { status: 'completed' as const, result } }))
          .with('send', () => {
            const report = match(result)
              .with({ status: 'answered' }, ({ text }) => `[${input.recipientName} replied privately. Tell the user what matters in a short message; do not message ${input.recipientName} again about this.]\n\n${text}`)
              .with({ status: 'unanswered', reason: 'aborted' }, () => null)
              .with({ status: 'unanswered' }, ({ reason }) => collaborationFailureNote(input.recipientName, reason))
              .exhaustive();

            return { status: 'running' as const, checkpoint: { phase: 'report' as const, result, report } };
          })
          .exhaustive(), context);
      },
      report: async (task, api, context) => {
        const { result, report: text } = task.state.checkpoint;

        await match(text)
          .with(P.string, async (answer) => {
            const sender = await api.conversation(api.conversationId, context);
            await sender?.submit({
              type: 'input',
              content: answer,
              whenBusy: 'followUp',
              requestId: `bots.reply:${task.input.requestId}`,
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
}

async function collaborationDeliver(
  harness: Harness,
  taskId: number,
  input: CollaborationTypes.CollaborationDeliveryInput,
  context: Context,
): Promise<CollaborationTypes.CollaborationResult> {
  const recipient = await harness.conversation(input.recipientConversationId, context);
  const whenBusy = match(input.mode).with('ask', () => 'reject' as const).with('send', () => 'followUp' as const).exhaustive();

  return match(recipient)
    .with(P.nonNullable, async (conversation): Promise<CollaborationTypes.CollaborationResult> => {
      try {
        const submission = await conversation.submit({
          type: 'input',
          content: `[Private message from ${input.senderName}. Answer this request; do not delegate it to another bot.]\n\n${input.message}`,
          requestId: `bots.delivery:${input.requestId}`,
          whenBusy,
          entry: { kind: COLLABORATION.message,
            data: {
              fromBotId: input.senderId,
              toBotId: input.recipientId,
              deliveryId: taskId,
            } },
        }, context);

        const settled = await submission.wait(context);

        return await match(settled)
          .with({ status: 'done', type: 'input' }, async ({ answer }) => ({
            status: 'answered' as const,
            answerId: answer,
            text: await harness.commit((tx) => collaborationAnswer(tx, answer), context),
          }))
          .with({ status: 'unanswered' }, ({ reason }) => ({ status: 'unanswered' as const, reason }))
          .otherwise(() => ({ status: 'unanswered' as const, reason: 'No answer was produced.' }));
      } catch (error) {
        return match(error)
          .with(P.instanceOf(ConversationBusy), () => ({ status: 'unanswered' as const, reason: 'Recipient is busy; use bot_message to queue work.' }))
          .otherwise((cause) => {
            throw cause;
          });
      }
    })
    .otherwise(() => ({ status: 'unanswered' as const, reason: 'Recipient conversation is unavailable.' }));
}
