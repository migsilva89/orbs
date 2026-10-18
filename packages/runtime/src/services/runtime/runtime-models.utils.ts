import { match, P } from 'ts-pattern';
import { runtimeModelRoute } from '../../types/runtime-model.types';
import { runtimeModelStream } from './runtime-model-stream.utils';
import type { RuntimeBotParams } from '../../types/runtime.types';
import type { Models } from '@earendil-works/pi-ai/models';
import type { ModelRef } from '@earendil-works/pi-durable';

const ROUTE_PROVIDER = 'openbots-fallback';

export function runtimeModelRef(bot: RuntimeBotParams): ModelRef {
  return match(bot.fallbackModel)
    .with(P.nonNullable, (fallback) => ({
      provider: ROUTE_PROVIDER,
      modelId: JSON.stringify({
        primary: { modelProvider: bot.modelProvider, modelId: bot.modelId, thinkingLevel: bot.thinkingLevel },
        fallback,
      }),
    }))
    .otherwise(() => ({ provider: bot.modelProvider, modelId: bot.modelId }));
}

// Pi accepts a Models interface. Bind delegated methods to preserve ModelRuntime's own state.
export function runtimeModels(models: Models): Models {
  const getModel: Models['getModel'] = (provider, id) => match(provider)
    .with(ROUTE_PROVIDER, () => {
      const route = runtimeModelParse(id);

      return match(route).with(P.nonNullable, (route) => {
        const primary = models.getModel(route.primary.modelProvider, route.primary.modelId);
        const fallback = models.getModel(route.fallback.modelProvider, route.fallback.modelId);

        return match(primary ?? fallback)
          .with(P.nonNullable, (model) => ({
            ...model,
            provider,
            id,
            contextWindow: Math.min(primary?.contextWindow ?? model.contextWindow, fallback?.contextWindow ?? model.contextWindow),
          }))
          .otherwise(() => undefined);
      }).otherwise(() => undefined);
    })
    .otherwise(() => models.getModel(provider, id));

  const streamSimple: Models['streamSimple'] = (model, context, options) => match(model.provider)
    .with(ROUTE_PROVIDER, () => runtimeModelStream(models, {
      route: runtimeModelRoute.parse(JSON.parse(model.id)),
      context,
      options,
    }))
    .otherwise(() => models.streamSimple(model, context, options));

  const fetchDeferred: Models['fetchDeferred'] = (model, handle, options) => models.fetchDeferred(
    models.getModel(handle.provider, handle.modelId) ?? model, handle, options,
  );

  const cancelDeferred: Models['cancelDeferred'] = (model, handle, options) => models.cancelDeferred(
    models.getModel(handle.provider, handle.modelId) ?? model, handle, options,
  );

  return new Proxy(models, {
    get: (target, property) => match(property)
      .with('getModel', () => getModel)
      .with('streamSimple', () => streamSimple)
      .with('fetchDeferred', () => fetchDeferred)
      .with('cancelDeferred', () => cancelDeferred)
      .otherwise(() => {
        const value: unknown = Reflect.get(target, property, target);
        return match(value).with(P.instanceOf(Function), (method) => method.bind(target)).otherwise(() => value);
      }),
  });
}

function runtimeModelParse(id: string) {
  try {
    return runtimeModelRoute.parse(JSON.parse(id));
  } catch {
    return undefined;
  }
}
