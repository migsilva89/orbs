import { configure, defineExtension } from '@earendil-works/pi-durable';
import { match } from 'ts-pattern';
import { runtimeBot, runtimeBotConversations } from './runtime.constants';
import type { RuntimeBotParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export function runtimeActionConfigureBot(
  { harness, registry, extensions, readOnlyTools }: RuntimeServiceDeps,
  bot: RuntimeBotParams,
  context: Context,
) {
  const resources = defineExtension({ name: `openbots.resources.${bot.id}`, tools: bot.tools });
  registry.install(resources);

  return harness.commit(async (tx) => {
    const binding = await tx.doc(runtimeBotConversations, bot.id, null);

    const conversationId = binding.conversationId
      ?? (await tx.createConversation({ ownership: { kind: 'ownerless' } })).id;

    binding.conversationId = conversationId;
    const identity = await tx.doc(runtimeBot, conversationId);
    identity.botId = bot.id;
    identity.skillsPrompt = bot.skillsPrompt;

    await configure(tx, conversationId, {
      model: { provider: bot.modelProvider, modelId: bot.modelId },
      thinkingLevel: bot.thinkingLevel,
      instructions: bot.instructions,
      cwd: `agents/${bot.id}`,
      extensions: [resources, ...extensions],
      tools: match(bot.permission)
        .with('read-only', () => readOnlyTools)
        .otherwise(() => null),
    });

    return conversationId;
  }, context);
}
