import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import { botQueryGet } from './bot-query.get';
import type { BotConfiguration, BotServiceDeps } from '../../types/bot.types';
import type { Bot, BotGetInput } from '@openbots/contracts/universal';

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

  async function botConfiguration(): Promise<BotConfiguration> {
    const [bot, skillSettings, mcpSettings, instructionSettings, pluginSettings] = await Promise.all([
      botQueryGet(deps, { botId }),
      deps.skill.queries.settings(),
      deps.mcp.queries.settings(),
      deps.instruction.queries.settings(),
      deps.plugin.queries.settings(),
    ]);

    return { bot, skillSettings, mcpSettings, instructionSettings, pluginSettings };
  }

  async function botConfigure() {
    return botPublish(await botConfiguration());
  }

  async function botPublish(configuration: BotConfiguration): Promise<Bot> {
    const { bot, skillSettings, mcpSettings, instructionSettings, pluginSettings } = configuration;
    await deps.workspace.actions.prepareDirectory({ botId });

    const { prompt: skillsPrompt } = deps.skill.queries.load({ bot, settings: skillSettings });
    const instructions = await deps.instruction.queries.load({ bot, settings: instructionSettings });

    const instructionFiles = match(instructions.diagnostics.length)
      .with(0, () => instructions.files)
      .otherwise(() => {
        throw new Errors.VALIDATION_ERROR({ fields: {
          instructions: { message: 'Cannot read configured instructions. Check the instruction catalog diagnostics.' },
        } });
      });

    const plugins = await deps.plugin.actions.load({ bot, settings: pluginSettings });
    const tools = await deps.mcp.actions.prepare({ bot, settings: mcpSettings });
    const latest = await botConfiguration();

    return match(botConfigureState(configuration) === botConfigureState(latest))
      .with(true, async () => {
        await deps.runtime.actions.configureBot({
          ...latest.bot,
          skillsPrompt,
          instructionFiles,
          plugins,
          tools,
        });
        return latest.bot;
      })
      .with(false, () => botPublish(latest))
      .exhaustive();
  }

  function botConfigureState({ bot, ...settings }: BotConfiguration) {
    return JSON.stringify({
      inherit: bot.inherit,
      modelProvider: bot.modelProvider,
      modelId: bot.modelId,
      thinkingLevel: bot.thinkingLevel,
      instructions: bot.instructions,
      permission: bot.permission,
      ...settings,
    });
  }
}
