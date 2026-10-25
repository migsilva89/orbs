import { copyJson } from '@earendil-works/chord';
import { AgentDoc } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeBot, runtimeBotConversations } from '../runtime/runtime.constants';
import { collaborationTemporaryBinding, collaborationTemporaryContext } from './collaboration.constants';
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

    return match(params.target ?? 'existing')
      .with('existing', () => mainConversationId)
      .with('temporary', () => collaborationTemporaryTarget(tx, mainConversationId))
      .exhaustive();
  }, context);

  async function collaborationTemporaryTarget(tx: PiDurableTypes.Tx, mainConversationId: PiDurableTypes.ConversationId) {
    const binding = await tx.doc(collaborationTemporaryBinding, `${params.senderId}:${params.senderStoreId}:${params.sourceConversationId}`, null);
    const now = Date.now();

    const conversationId = await match(binding)
      .with({ conversationId: P.nonNullable, expiresAt: P.number.gt(now) }, (current) => current.conversationId)
      .otherwise(async () => {
        await match(binding.conversationId)
          .with(P.nonNullable, async (id) => {
            const previous = await tx.doc(collaborationTemporaryContext, id);
            previous.archivedAt = now;
          })
          .otherwise(() => undefined);

        const conversation = await tx.createConversation({ ownership: { kind: 'ownerless' } });
        const metadata = await tx.doc(collaborationTemporaryContext, conversation.id);
        const expiresAt = now + params.temporaryTtlMs;

        Object.assign(metadata, {
          senderId: params.senderId,
          sourceConversationId: params.sourceConversationId,
          recipientId: params.recipientId,
          createdAt: now,
          expiresAt,
          archivedAt: null,
        });
        binding.conversationId = conversation.id;
        binding.expiresAt = expiresAt;

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
