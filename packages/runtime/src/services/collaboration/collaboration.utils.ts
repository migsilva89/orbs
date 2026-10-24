import { AssistantEntry } from '@earendil-works/pi-durable';
import { replySilent } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeBot } from '../runtime/runtime.constants';
import type { CollaborationDeliveryInput } from '../../types/collaboration.types';
import type { Context } from '@earendil-works/chord/context';
import type { EntryId, ToolExecutionApi, Tx } from '@earendil-works/pi-durable';

export async function collaborationBotId(api: ToolExecutionApi, context: Context) {
  const identity = await api.snapshot(runtimeBot, api.conversationId, context);

  return match(identity?.botId)
    .with(P.string, (id) => id)
    .otherwise(() => {
      throw new Errors.FORBIDDEN();
    });
}

export async function collaborationAnswer(tx: Tx, answerId: EntryId) {
  const entry = await tx.entry(AssistantEntry, answerId);

  return (entry?.model ?? []).flatMap((message) => match(message)
    .with({ role: 'assistant' }, ({ content }) => content.flatMap((part) => match(part)
      .with({ type: 'text' }, ({ text }) => (replySilent.safeParse(text).success ? [] : [text]))
      .otherwise(() => [])))
    .otherwise(() => [])).join('\n');
}

export function collaborationFailureNote(recipientName: string, reason: string) {
  return `[Your message to ${recipientName} failed: ${reason}] Tell the user in one short sentence that you could not reach ${recipientName} and will try again, then send it once more. If it already failed twice, tell the user and stop.`;
}

export function collaborationPeerNote({ senderName, hops, maxHops }: Pick<CollaborationDeliveryInput, 'senderName' | 'hops' | 'maxHops'>) {
  const left = maxHops - hops;

  return match(left > 0)
    .with(true, () => `[Private message from ${senderName}. Answer this request yourself when you can. If another bot must help, you may forward it; ${left} more ${left === 1 ? 'hop is' : 'hops are'} left.]`)
    .with(false, () => `[Private message from ${senderName}. Answer this request; it cannot be forwarded to another bot.]`)
    .exhaustive();
}
