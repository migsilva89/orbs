import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeBot, runtimeBotConversations } from './runtime.constants';
import type { RuntimeContextInput, RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ConversationId } from '@earendil-works/pi-durable';

export async function runtimeQueryConversation(
  { harness }: Pick<RuntimeServiceDeps, 'harness'>,
  { botId, conversationId: selectedId, context }: RuntimeConversationParams & RuntimeContextInput,
) {
  const binding = await harness.snapshot(runtimeBotConversations, botId, context);

  const rootId = match(binding?.conversationId)
    .with(P.nonNullable, (id) => id)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: botId });
    });

  // SAFETY: a selected ID is only a lookup key; the identity check below rejects any conversation outside this bot.
  const conversationId = (selectedId ?? rootId) as ConversationId;
  const identity = await harness.snapshot(runtimeBot, conversationId, context);

  match(identity?.botId === botId)
    .with(true, () => undefined)
    .with(false, () => {
      throw new Errors.NOT_FOUND({ resource: 'conversation', resourceId: conversationId });
    })
    .exhaustive();

  const conversation = await harness.conversation(conversationId, context);

  return match(conversation)
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Bot conversation is missing from runtime storage' });
    });
}
