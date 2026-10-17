import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeBotConversations } from './runtime.constants';
import type { RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryConversation(
  { harness }: RuntimeServiceDeps,
  { botId }: RuntimeConversationParams,
  context: Context,
) {
  const binding = await harness.snapshot(runtimeBotConversations, botId, context);

  const conversationId = match(binding?.conversationId)
    .with(P.nonNullable, (id) => id)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: botId });
    });

  const conversation = await harness.conversation(conversationId, context);

  return match(conversation)
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Bot conversation is missing from runtime storage' });
    });
}
