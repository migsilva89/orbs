import { Errors } from '@openbots/errors/universal';
import { log } from '@openbots/logger/server';
import { match, P } from 'ts-pattern';
import type { RuntimeBot, RuntimeBotChange } from '../../types/runtime.types';

interface RuntimeDirectoryParams {
  open: (botId: string) => Promise<RuntimeBot>;
}

/**
 * Open bot stores on demand. Only registered bots open, so an unknown ID never creates a store. A failed store closes
 * only its own bot and reports `isFailed`; the next request reopens it. A close holds the bot until its file work ends,
 * so no request reopens a store that is being closed or deleted. A reopened store wakes at once; the first open waits
 * for the host's `resume`.
 */
export function runtimeDirectory({ open }: RuntimeDirectoryParams) {
  const known = new Set<string>();
  const loading = new Map<string, Promise<RuntimeBot>>();
  const opened = new Map<string, RuntimeBot>();
  const closing = new Map<string, Promise<void>>();
  const started = new Set<string>();
  const listeners = new Set<(change: RuntimeBotChange) => void>();

  const emit = (change: RuntimeBotChange) => {
    for (const listener of listeners) {
      listener(change);
    }
  };

  const forget = (botId: string, isFailed: boolean) => {
    loading.delete(botId);

    match(opened.delete(botId))
      .with(true, () => emit({
        type: 'closed',
        botId,
        isFailed,
      }))
      .with(false, () => undefined)
      .exhaustive();
  };

  const fail = (bot: RuntimeBot, error: unknown) => {
    const { botId } = bot.deps;
    log.error({
      tag: 'runtime',
      message: 'Bot store failed; it reopens on the next request.',
      botId,
      error,
    });

    match(opened.get(botId) === bot)
      .with(true, () => {
        // `close` clears the bot's alarm before it yields, so a listener can arm the reopen alarm afterwards.
        void bot.close().catch(() => undefined);
        forget(botId, true);
      })
      .with(false, () => undefined)
      .exhaustive();
  };

  const load = (botId: string) => match(loading.get(botId))
    .with(P.nonNullable, (pending) => pending)
    .otherwise(() => {
      const pending = open(botId).then((bot) => {
        opened.set(botId, bot);
        emit({ type: 'opened', bot });

        match(started.has(botId))
          .with(true, () => bot.wake())
          .with(false, () => started.add(botId))
          .exhaustive();

        void bot.deps.harness.closed.then((end) => match(end)
          .with({ reason: 'failed' }, ({ error }) => fail(bot, error))
          .otherwise(() => undefined));

        return bot;
      });

      loading.set(botId, pending);
      pending.catch(() => loading.delete(botId));

      return pending;
    });

  const bot = (botId: string) => match(known.has(botId))
    .with(true, async () => {
      await closing.get(botId);
      return load(botId);
    })
    .with(false, () => Promise.reject(new Errors.NOT_FOUND({ resource: 'bot', resourceId: botId })))
    .exhaustive();

  /** Close the bot's store, then run `after` (for example deleting the file) before any request can reopen it. */
  const close = (botId: string, after: () => Promise<void> = () => Promise.resolve()) => {
    const current = (closing.get(botId) ?? Promise.resolve()).then(async () => {
      const previous = await loading.get(botId)?.catch(() => null);
      forget(botId, false);
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
    bot,
    harness: (botId: string) => bot(botId).then(({ deps }) => deps.harness),
    opened: () => [...opened.values()],
    onChange: (listener: (change: RuntimeBotChange) => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    close,
    closeAll: async () => {
      await Promise.all([...loading.keys()].map((botId) => close(botId)));
    },
  };
}
