import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { botActionConfigure } from './bot-action.configure';
import { botRecord } from './bot.utils';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotSwapModelsInput, BotSwapModelsResult } from '@openbots/contracts/universal';

export async function botActionSwapModels(deps: BotServiceDeps, params: BotSwapModelsInput): Promise<BotSwapModelsResult> {
  deps.runtime.queries.validateModel(params.to);

  const result = await deps.database.db.transaction().execute(async (tx) => {
    const bots = (await tx.selectFrom('bot').selectAll().where('id', 'in', params.botIds).execute()).map(botRecord);
    const found = new Set(bots.map((bot) => bot.id));

    match(params.botIds.find((botId) => !found.has(botId)))
      .with(P.string, (resourceId) => {
        throw new Errors.NOT_FOUND({ resource: 'bot', resourceId });
      })
      .otherwise(() => undefined);

    const now = Date.now();

    const changes = bots.flatMap((bot) => {
      const fallbackModel = match({ includeFallbacks: params.includeFallbacks, fallbackModel: bot.fallbackModel })
        .with(
          { includeFallbacks: true, fallbackModel: { modelProvider: params.from.modelProvider, modelId: params.from.modelId } },
          () => params.to,
        )
        .otherwise(() => bot.fallbackModel);

      const next = match(bot)
        .with({ modelProvider: params.from.modelProvider, modelId: params.from.modelId }, () => ({ ...bot, ...params.to, fallbackModel }))
        .otherwise(() => ({ ...bot, fallbackModel }));

      const hasPrimaryChanged = bot.modelProvider !== next.modelProvider || bot.modelId !== next.modelId || bot.thinkingLevel !== next.thinkingLevel;
      const hasFallbackChanged = JSON.stringify(bot.fallbackModel) !== JSON.stringify(next.fallbackModel);

      return match(hasPrimaryChanged || hasFallbackChanged)
        .with(false, () => [])
        .with(true, () => {
          deps.runtime.queries.validateModel(next);
          return [{ next, hasPrimaryChanged, hasFallbackChanged }];
        })
        .exhaustive();
    });

    await Promise.all(changes.map(({ next, hasPrimaryChanged, hasFallbackChanged }) => tx.updateTable('bot').set({
      ...match(hasPrimaryChanged)
        .with(true, () => ({ modelProvider: next.modelProvider, modelId: next.modelId, thinkingLevel: next.thinkingLevel }))
        .with(false, () => ({}))
        .exhaustive(),
      ...match(hasFallbackChanged)
        .with(true, () => ({ fallbackModel: JSON.stringify(next.fallbackModel) }))
        .with(false, () => ({}))
        .exhaustive(),
      updatedAt: now,
    }).where('id', '=', next.id).execute()));

    return {
      botIds: changes.map(({ next }) => next.id),
      primary: changes.filter(({ hasPrimaryChanged }) => hasPrimaryChanged).length,
      fallbacks: changes.filter(({ hasFallbackChanged }) => hasFallbackChanged).length,
    };
  });

  await match(result.botIds)
    .with([], () => undefined)
    .otherwise(async (botIds) => {
      for (const listener of deps.changes) {
        listener();
      }

      await Promise.all(botIds.map((botId) => botActionConfigure(deps, { botId })));
    });

  return { primary: result.primary, fallbacks: result.fallbacks };
}
