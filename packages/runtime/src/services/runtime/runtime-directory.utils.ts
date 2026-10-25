import { Errors } from '@repo/errors/universal';
import { log } from '@repo/logger/server';
import { match, P } from 'ts-pattern';
import type * as RuntimeTypes from '../../types/runtime.types';

export function runtimeDirectory({ open }: RuntimeTypes.RuntimeDirectoryParams) {
  const known = new Set<string>();
  const loading = new Map<string, Promise<RuntimeTypes.RuntimeBot>>();
  const opened = new Map<string, RuntimeTypes.RuntimeBot>();
  const closing = new Map<string, Promise<void>>();
  const started = new Set<string>();
  const listeners = new Set<(change: RuntimeTypes.RuntimeBotChange) => void>();

  const runtimeDirectoryEmit = (change: RuntimeTypes.RuntimeBotChange) => {
    for (const listener of listeners) {
      listener(change);
    }
  };

  const runtimeDirectoryForget = (botId: string, isFailed: boolean) => {
    loading.delete(botId);

    match(opened.delete(botId))
      .with(true, () => runtimeDirectoryEmit({
        type: 'closed',
        botId,
        isFailed,
      }))
      .with(false, () => undefined)
      .exhaustive();
  };

  const runtimeDirectoryFail = (bot: RuntimeTypes.RuntimeBot, { error }: RuntimeTypes.RuntimeBotFailure) => {
    const { botId } = bot.deps;
    log.error({
      tag: 'runtime',
      message: 'Bot store failed; it reopens on the next request.',
      botId,
      error,
    });

    match(opened.get(botId) === bot)
      .with(true, () => {
        void bot.close().catch(() => undefined);
        runtimeDirectoryForget(botId, true);
      })
      .with(false, () => undefined)
      .exhaustive();
  };

  const runtimeDirectoryLoad = (botId: string) => match(loading.get(botId))
    .with(P.nonNullable, (pending) => pending)
    .otherwise(() => {
      const pending = open(botId).then((bot) => {
        opened.set(botId, bot);
        runtimeDirectoryEmit({ type: 'opened', bot });

        match(started.has(botId))
          .with(true, () => bot.wake())
          .with(false, () => started.add(botId))
          .exhaustive();

        void bot.deps.harness.closed.then((end) => match(end)
          .with({ reason: 'failed' }, (failure) => runtimeDirectoryFail(bot, failure))
          .otherwise(() => undefined));

        return bot;
      });

      loading.set(botId, pending);
      pending.catch(() => loading.delete(botId));

      return pending;
    });

  const runtimeDirectoryBot = (botId: string) => match(known.has(botId))
    .with(true, async () => {
      await closing.get(botId);
      return runtimeDirectoryLoad(botId);
    })
    .with(false, () => Promise.reject(new Errors.NOT_FOUND({ resource: 'bot', resourceId: botId })))
    .exhaustive();

  const runtimeDirectoryClose = (botId: string, after: () => Promise<void> = () => Promise.resolve()) => {
    const current = (closing.get(botId) ?? Promise.resolve()).then(async () => {
      const previous = await loading.get(botId)?.catch(() => null);
      runtimeDirectoryForget(botId, false);
      await previous?.close();
      await after();
    });

    const settled = current.then(() => undefined, () => undefined);
    closing.set(botId, settled);

    void settled.then(() => match(closing.get(botId) === settled)
      .with(true, () => closing.delete(botId))
      .with(false, () => undefined)
      .exhaustive());

    return current;
  };

  return {
    register: (botId: string) => {
      known.add(botId);
    },
    unregister: (botId: string) => {
      known.delete(botId);
    },
    bot: runtimeDirectoryBot,
    harness: (botId: string) => runtimeDirectoryBot(botId).then(({ deps }) => deps.harness),
    opened: () => [...opened.values()],
    onChange: (listener: (change: RuntimeTypes.RuntimeBotChange) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    close: runtimeDirectoryClose,
    closeAll: async () => {
      await Promise.all([...loading.keys()].map((botId) => runtimeDirectoryClose(botId)));
    },
  };
}
