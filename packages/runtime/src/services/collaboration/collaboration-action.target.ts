import { copyJson } from '@earendil-works/chord';
import { AgentDoc } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { runtimeBot } from '../runtime/runtime.constants';
import { collaborationTemporaryBinding, collaborationTemporaryContext } from './collaboration.constants';
import type { CollaborationTargetParams } from '../../types/collaboration.types';
import type { AgentState, ConversationId, Tx } from '@earendil-works/pi-durable';

export function collaborationActionTarget(tx: Tx, params: CollaborationTargetParams) {
  return match(params.context ?? 'existing')
    .with('existing', () => Promise.resolve(params.mainConversationId))
    .with('temporary', async () => {
      const binding = await tx.doc(collaborationTemporaryBinding, params.sourceConversationId, params.recipientId, null);
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

      await collaborationCopyRecipient(tx, params.mainConversationId, conversationId);

      return conversationId;
    })
    .exhaustive();
}

async function collaborationCopyRecipient(tx: Tx, mainId: ConversationId, targetId: ConversationId) {
  const source = copyJson(await tx.doc(AgentDoc, mainId));
  const target = await tx.doc(AgentDoc, targetId);

  for (const key of Object.keys(target) as (keyof AgentState)[]) {
    // Chord removes draft properties assigned undefined.
    target[key] = undefined;
  }

  Object.assign(target, source);
  const identity = await tx.doc(runtimeBot, mainId);
  const recipient = await tx.doc(runtimeBot, targetId);
  recipient.botId = identity.botId;
  recipient.skillsPrompt = identity.skillsPrompt;
}
