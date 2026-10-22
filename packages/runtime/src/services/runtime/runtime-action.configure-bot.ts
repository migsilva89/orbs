import { configure, defineExtension } from '@earendil-works/pi-durable';
import { match } from 'ts-pattern';
import { runtimeModelRef } from './runtime-models.utils';
import { runtimePluginsInstall } from './runtime-plugins.utils';
import { RUNTIME_HTML_GUIDE, runtimeBot, runtimeBotConversations } from './runtime.constants';
import type { RuntimeBotParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeActionConfigureBot(
  { appName, harness, registry, extensions, readOnlyTools, index }: RuntimeServiceDeps,
  bot: RuntimeBotParams,
  context: Context,
) {
  // Persisted Pi extension id; renaming would drop already admitted tools.
  const botTools = defineExtension({ name: `bots.resources.${bot.id}`, tools: bot.tools });
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
      model: runtimeModelRef(bot),
      thinkingLevel: bot.thinkingLevel,
      instructions: [
        `# ${appName} runtime`,
        `You are a bot inside ${appName}. ${appName} is the host application; Pi Durable is your agent harness, running inside the ${appName} daemon. Your model provider supplies inference, not the host or harness. You are not a standalone Pi, Codex CLI, Claude Code, or Paseo session.`,
        `Your ${appName} bot ID is ${bot.id}. Your configured primary model is ${bot.modelProvider}/${bot.modelId}, with ${bot.thinkingLevel} thinking. This is configuration, not proof of which model served a particular response; a configured fallback may be used.`,
        `${appName} persists your conversation and runs your tools. The available tool schemas describe your current capabilities. ${appName} tools use the bot_ prefix for bot management, peer messaging, questions, routines, todos, history, reactions, and artifacts. Native Pi tools, MCP tools, and plugins retain their own names. Use only tools actually available to you; access is subject to your bot permission policy.`,
        'Bot settings, selected instruction files, and skills provide additional context. Do not infer your machine, deployment location, or launcher from a provider name or an instruction file path. If the current context does not establish those details, say they are unknown.',
        RUNTIME_HTML_GUIDE,
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
