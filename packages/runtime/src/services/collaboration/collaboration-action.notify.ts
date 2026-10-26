import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeBotConversations } from '../runtime/runtime.constants';
import { collaborationQueryOrigin } from './collaboration-query.origin';
import { COLLABORATION, collaborationPrivateContext } from './collaboration.constants';
import { collaborationOwnerNote } from './collaboration.utils';
import type { CollaborationNotifyCall, CollaborationToolDeps } from '../../types/collaboration.types';

export async function collaborationActionNotify(deps: CollaborationToolDeps, { input, api, context }: CollaborationNotifyCall) {
  const origin = await collaborationQueryOrigin(api, context);
  const binding = await api.snapshot(runtimeBotConversations, origin.botId, context);

  const mainConversationId = match(binding?.conversationId)
    .with(P.number, (id) => id)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'conversation', resourceId: origin.botId });
    });

  if (mainConversationId === api.conversationId) {
    return { output: [{ type: 'text' as const, text: 'You are already in your main chat with the owner; reply here instead.' }] };
  }

  const hops = match(Number.isFinite(origin.hops))
    .with(true, () => origin.hops)
    .with(false, () => {
      throw new Errors.FORBIDDEN();
    })
    .exhaustive();

  const metadata = await api.snapshot(collaborationPrivateContext, api.conversationId, context);
  const peerBotId = metadata?.senderId ?? null;
  const peers = await deps.policy.queries.bots({ botId: origin.botId });
  const peerName = peers.find((bot) => bot.id === peerBotId)?.name ?? null;

  const main = match(await api.conversation(mainConversationId, context))
    .with(P.nonNullable, (conversation) => conversation)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'conversation', resourceId: String(mainConversationId) });
    });

  await main.submit({
    type: 'input',
    content: `${collaborationOwnerNote(peerName)}\n\n${input.message}`,
    whenBusy: 'followUp',
    requestId: `bots.owner-note:${api.conversationId}:${api.taskId}`,
    entry: { kind: COLLABORATION.note,
      data: {
        peerBotId,
        conversationId: api.conversationId,
        hops,
        text: input.message,
      } },
  }, context);

  return { output: [{ type: 'text' as const, text: 'Sent to your main chat; you will tell the owner there. Carry on here.' }] };
}
