import { match } from 'ts-pattern';
import { botQueryGet } from './bot-query.get';
import type { BotServiceDeps } from '../../types/bot.types';
import type { Bot, BotGetInput, ResourceSettings } from '@openbots/contracts/universal';

export async function botActionConfigure(deps: BotServiceDeps, { botId }: BotGetInput) {
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
    const settings = await deps.resources.queries.settings();
    return botPublish(bot, settings);
  }

  async function botPublish(bot: Bot, settings: ResourceSettings): Promise<Bot> {
    await deps.workspace.actions.prepareDirectory({ botId });

    const { prompt: skillsPrompt } = deps.skill.queries.load({
      botId,
      skillDirs: settings.skillDirs,
      isInherited: bot.inherit.includes('skills'),
    });

    const tools = await deps.mcp.actions.prepare({
      botId,
      mcpPaths: settings.mcpPaths,
      isInherited: bot.inherit.includes('mcp'),
    });

    const latestBot = await botQueryGet(deps, { botId });
    const latestSettings = await deps.resources.queries.settings();

    return match(botConfigureState(bot, settings) === botConfigureState(latestBot, latestSettings))
      .with(true, async () => {
        await deps.runtime.actions.configureBot({
          ...latestBot,
          skillsPrompt,
          tools,
        });
        return latestBot;
      })
      .with(false, () => botPublish(latestBot, latestSettings))
      .exhaustive();
  }

  function botConfigureState(bot: Bot, settings: ResourceSettings) {
    return JSON.stringify({
      inherit: bot.inherit,
      modelProvider: bot.modelProvider,
      modelId: bot.modelId,
      thinkingLevel: bot.thinkingLevel,
      instructions: bot.instructions,
      permission: bot.permission,
      skillDirs: settings.skillDirs,
      mcpPaths: settings.mcpPaths,
    });
  }
}
