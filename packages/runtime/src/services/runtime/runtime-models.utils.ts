import { createAssistantMessageEventStream } from '@earendil-works/pi-ai/utils/event-stream';
import { match, P } from 'ts-pattern';
import { runtimeModelRoute } from '../../types/runtime-model.types';
import { runtimeModelFailure, runtimeModelStream } from './runtime-model-stream.utils';
import { RUNTIME_MAX_MODEL_REQUESTS } from './runtime.constants';
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
      return match(runtimeModelParse(id)).with(P.nonNullable, (route) => {
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

  const routedStream: Models['streamSimple'] = (model, context, options) => match(model.provider)
    .with(ROUTE_PROVIDER, () => runtimeModelStream(models, {
      route: runtimeModelRoute.parse(JSON.parse(model.id)),
      context,
      options,
    }))
    .otherwise(() => models.streamSimple(model, context, options));

  const streamSimple = runtimeModelLimit(routedStream, RUNTIME_MAX_MODEL_REQUESTS);

  const completeSimple: Models['completeSimple'] = (model, context, options) => streamSimple(model, context, options).result();

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
      .with('completeSimple', () => completeSimple)
      .with('fetchDeferred', () => fetchDeferred)
      .with('cancelDeferred', () => cancelDeferred)
      .otherwise(() => {
        const value: unknown = Reflect.get(target, property, target);
        return match(value).with(P.instanceOf(Function), (method) => method.bind(target)).otherwise(() => value);
      }),
  });
}

/**
 * A slot is held only while a provider stream runs, never across tool calls,
 * so a parent waiting on a subagent or peer bot cannot deadlock the queue.
 */
function runtimeModelLimit(stream: Models['streamSimple'], maxRequests: number): Models['streamSimple'] {
  let active = 0;
  const waiting: (() => void)[] = [];

  const release = () => match(waiting.shift())
    .with(P.nonNullable, (next) => next())
    .otherwise(() => {
      active -= 1;
    });

  const acquire = (signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
    match({ isAborted: signal?.aborted === true, hasSlot: active < maxRequests })
      .with({ isAborted: true }, () => reject(new Error('Model request aborted.')))
      .with({ hasSlot: true }, () => {
        active += 1;
        resolve();
      })
      .otherwise(() => {
        const start = () => {
          signal?.removeEventListener('abort', cancel);
          resolve();
        };

        const cancel = () => {
          waiting.splice(waiting.indexOf(start), 1);
          reject(new Error('Model request aborted.'));
        };

        waiting.push(start);
        signal?.addEventListener('abort', cancel, { once: true });
      });
  });

  return (model, context, options) => {
    const output = createAssistantMessageEventStream();

    const run = async () => {
      await acquire(options?.signal);

      try {
        for await (const event of stream(model, context, options)) {
          output.push(event);
        }
      } finally {
        release();
      }
    };

    void run().catch(() => {
      output.push(runtimeModelFailure({
        api: model.api,
        provider: model.provider,
        model: model.id,
      }, options));
    });

    return output;
  };
}

function runtimeModelParse(id: string) {
  try {
    return runtimeModelRoute.parse(JSON.parse(id));
  } catch {
    return undefined;
  }
}
