import { match } from 'ts-pattern';
import { botQueryGet } from './bot-query.get';
import type { BotServiceDeps } from '../../types/bot.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export async function botActionConfigure(deps: BotServiceDeps, { botId }: UniversalTypes.BotGetInput) {
  const previous = deps.configurations.get(botId) ?? Promise.resolve();
  const current = previous.then(botConfigure);
  const settled = current.then(() => undefined, () => undefined);
  deps.configurations.set(botId, settled);

  try {
    return await current;
  } finally {
    match(deps.configurations.get(botId) === settled)
      .with(true, () => {
        deps.configurations.delete(botId);
      })
      .with(false, () => undefined)
      .exhaustive();
  }

  async function botConfigure() {
    const bot = await botQueryGet(deps, { botId });
    const skillSettings = await deps.skill.queries.settings();
    const mcpSettings = await deps.mcp.queries.settings();
    return botPublish(bot, skillSettings, mcpSettings);
  }

  async function botPublish(
    bot: UniversalTypes.Bot,
    skillSettings: UniversalTypes.SkillSettings,
    mcpSettings: UniversalTypes.McpSettings,
  ): Promise<UniversalTypes.Bot> {
    await deps.workspace.actions.prepareDirectory({ botId });

    const { prompt: skillsPrompt } = deps.skill.queries.load({
      bot,
      settings: skillSettings,
    });

    const tools = await deps.mcp.actions.prepare({
      bot,
      settings: mcpSettings,
    });

    const latestBot = await botQueryGet(deps, { botId });
    const latestSkillSettings = await deps.skill.queries.settings();
    const latestMcpSettings = await deps.mcp.queries.settings();

    return match(botConfigureState(bot, skillSettings, mcpSettings)
      === botConfigureState(latestBot, latestSkillSettings, latestMcpSettings))
      .with(true, async () => {
        await deps.runtime.actions.configureBot({
          ...latestBot,
          skillsPrompt,
          tools,
        });
        return latestBot;
      })
      .with(false, () => botPublish(latestBot, latestSkillSettings, latestMcpSettings))
      .exhaustive();
  }

  function botConfigureState(bot: UniversalTypes.Bot, skillSettings: UniversalTypes.SkillSettings, mcpSettings: UniversalTypes.McpSettings) {
    return JSON.stringify({
      inherit: bot.inherit,
      modelProvider: bot.modelProvider,
      modelId: bot.modelId,
      thinkingLevel: bot.thinkingLevel,
      instructions: bot.instructions,
      permission: bot.permission,
      directories: skillSettings.directories,
      paths: mcpSettings.paths,
    });
  }
}
