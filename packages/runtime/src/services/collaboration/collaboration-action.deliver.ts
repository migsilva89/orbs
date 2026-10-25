import { ConversationBusy } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { COLLABORATION } from './collaboration.constants';
import { collaborationAnswer, collaborationPeerNote } from './collaboration.utils';
import type * as CollaborationTypes from '../../types/collaboration.types';

export async function collaborationActionDeliver(
  { harness }: CollaborationTypes.CollaborationHarnessDeps,
  { taskId, input, context }: CollaborationTypes.CollaborationDeliverParams,
): Promise<CollaborationTypes.CollaborationResult> {
  const recipient = await harness.conversation(input.recipientConversationId, context);
  const whenBusy = match(input.mode).with('ask', () => 'reject' as const).with('send', () => 'followUp' as const).exhaustive();

  return match(recipient)
    .with(P.nonNullable, async (conversation): Promise<CollaborationTypes.CollaborationResult> => {
      try {
        const submission = await conversation.submit({
          type: 'input',
          content: `${collaborationPeerNote(input)}\n\n${input.message}`,
          requestId: `bots.delivery:${input.requestId}`,
          whenBusy,
          entry: { kind: COLLABORATION.message,
            data: {
              fromBotId: input.senderId,
              toBotId: input.recipientId,
              deliveryId: taskId,
              hops: input.hops,
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
