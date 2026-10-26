import { copyJson } from '@earendil-works/chord';
import { AgentDoc } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeBot, runtimeBotConversations } from '../runtime/runtime.constants';
import { collaborationPrivateBinding, collaborationPrivateContext } from './collaboration.constants';
import type { CollaborationHarnessDeps, CollaborationTargetParams } from '../../types/collaboration.types';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export function collaborationActionTarget({ harness }: CollaborationHarnessDeps, { context, ...params }: CollaborationTargetParams) {
  return harness.commit(async (tx) => {
    const main = await tx.doc(runtimeBotConversations, params.recipientId, null);

    const mainConversationId = match(main.conversationId)
      .with(P.nonNullable, (id) => id)
      .otherwise(() => {
        throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: params.recipientId });
      });

    return match(params.target)
      .with('existing', () => mainConversationId)
      .with('private', () => collaborationPrivateTarget(tx, mainConversationId))
      .exhaustive();
  }, context);

  async function collaborationPrivateTarget(tx: PiDurableTypes.Tx, mainConversationId: PiDurableTypes.ConversationId) {
    const binding = await tx.doc(collaborationPrivateBinding, `${params.senderId}:${params.senderStoreId}`, null);

    const conversationId = await match(binding.conversationId)
      .with(P.nonNullable, (id) => id)
      .otherwise(async () => {
        const conversation = await tx.createConversation({ ownership: { kind: 'ownerless' } });
        const metadata = await tx.doc(collaborationPrivateContext, conversation.id);

        Object.assign(metadata, {
          senderId: params.senderId,
          recipientId: params.recipientId,
          createdAt: Date.now(),
        });
        binding.conversationId = conversation.id;

        return conversation.id;
      });

    await collaborationCopyRecipient(tx, mainConversationId, conversationId);

    return conversationId;
  }

  async function collaborationCopyRecipient(tx: PiDurableTypes.Tx, mainId: PiDurableTypes.ConversationId, targetId: PiDurableTypes.ConversationId) {
    const source = copyJson(await tx.doc(AgentDoc, mainId));
    const target = await tx.doc(AgentDoc, targetId);

    Object.assign(target, Object.fromEntries(Object.keys(target).map((key) => [key, undefined])), source);
    const identity = await tx.doc(runtimeBot, mainId);
    const recipient = await tx.doc(runtimeBot, targetId);
    recipient.botId = identity.botId;
    recipient.skillsPrompt = identity.skillsPrompt;
  }
}
