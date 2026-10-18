import { configure, defineExtension } from '@earendil-works/pi-durable';
import { match } from 'ts-pattern';
import { runtimePluginsInstall } from './runtime-plugins.utils';
import { runtimeBot, runtimeBotConversations } from './runtime.constants';
import type { RuntimeBotParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeActionConfigureBot(
  { harness, registry, extensions, readOnlyTools, index }: RuntimeServiceDeps,
  bot: RuntimeBotParams,
  context: Context,
) {
  // Persisted Pi extension id; renaming would drop already admitted tools.
  const botTools = defineExtension({ name: `openbots.resources.${bot.id}`, tools: bot.tools });
  runtimePluginsInstall(registry, bot.plugins);
  registry.install(botTools);

  const mainConversationId = await harness.commit(async (tx) => {
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
      instructions: [
        ...bot.instructionFiles.map(({ path, content }) => `# ${path}\n\n${content}`),
        bot.instructions,
      ].filter(Boolean).join('\n\n'),
      cwd: `agents/${bot.id}`,
      extensions: [botTools, ...bot.plugins, ...extensions],
      tools: match(bot.permission)
        .with('read-only', () => readOnlyTools)
        .otherwise(() => null),
    });

    return conversationId;
  }, context);

  await index.actions.restore({ botId: bot.id, conversationId: mainConversationId }, context);

  return mainConversationId;
}
