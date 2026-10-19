import { replicatedState } from '@earendil-works/chord';
import { log } from '@openbots/logger/server';
import { match } from 'ts-pattern';
import type { RuntimeBot, RuntimeDirectory } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { WatchEnd } from '@earendil-works/pi-durable';

interface RuntimeMergeSource<T> {
  state: { value: T; subscribe: (listener: (value: T) => void) => () => void };
  closed: Promise<unknown>;
  stop: () => Promise<unknown>;
}

interface RuntimeWatchMergeParams<T, S extends object> {
  directory: RuntimeDirectory;
  initial: S;
  attach: (bot: RuntimeBot, context: Context) => Promise<RuntimeMergeSource<T>>;
  /** Apply one bot's latest value; `null` when that bot's store closed. */
  apply: (draft: S, botId: string, value: T | null) => void;
  context: Context;
}

/**
 * One live view across every open bot store; bots that open or close later join or leave it. A bot whose own watch
 * fails is logged and left out, so one bad store never breaks the view for the others.
 */
export async function runtimeWatchMerge<T, S extends object>({ directory, initial, attach, apply, context }: RuntimeWatchMergeParams<T, S>) {
  const state = replicatedState<S>(initial);
  const sources = new Map<string, { source: RuntimeMergeSource<T>; unsubscribe: () => void }>();
  let isStopped = false;
  let finish: (end: WatchEnd) => void = () => undefined;

  const closed = new Promise<WatchEnd>((resolve) => {
    finish = resolve;
  });

  const remove = (botId: string, source?: RuntimeMergeSource<T>) => {
    const entry = sources.get(botId);

    match(entry !== undefined && (source === undefined || entry.source === source))
      .with(true, () => {
        sources.delete(botId);
        entry?.unsubscribe();

        match(isStopped)
          .with(true, () => undefined)
          .with(false, () => state.change(context, (draft) => apply(draft as S, botId, null)))
          .exhaustive();
      })
      .with(false, () => undefined)
      .exhaustive();
  };

  const add = async (bot: RuntimeBot) => {
    const { botId } = bot.deps;

    await match(sources.has(botId) || isStopped)
      .with(true, () => undefined)
      .with(false, async () => {
        const source = await attach(bot, context);

        await match(isStopped)
          .with(true, () => source.stop())
          .with(false, () => {
            const unsubscribe = source.state.subscribe((value) => {
              state.change(context, (draft) => apply(draft as S, botId, value));
            });

            sources.set(botId, { source, unsubscribe });
            state.change(context, (draft) => apply(draft as S, botId, source.state.value));

            // A watch can end while its store stays open; attach again so the bot does not drop out of the view.
            void source.closed.then(() => {
              remove(botId, source);

              match(directory.opened().includes(bot))
                .with(true, () => void join(bot))
                .with(false, () => undefined)
                .exhaustive();
            });
          })
          .exhaustive();
      })
      .exhaustive();
  };

  const join = (bot: RuntimeBot) => add(bot).catch((error: unknown) => match(isStopped || context.abortSignal?.aborted === true)
    .with(true, () => undefined)
    .with(false, () => log.error({
      tag: 'runtime-watch',
      message: 'Cannot attach a bot watch.',
      botId: bot.deps.botId,
      error,
    }))
    .exhaustive());

  const unlisten = directory.onChange((change) => match(change)
    .with({ type: 'opened' }, ({ bot }) => void join(bot))
    .with({ type: 'closed' }, ({ botId }) => remove(botId))
    .exhaustive());

  const stop = async (): Promise<WatchEnd> => {
    isStopped = true;
    unlisten();
    const entries = [...sources.values()];
    sources.clear();
    await Promise.all(entries.map(({ source, unsubscribe }) => {
      unsubscribe();
      return source.stop();
    }));
    finish({ reason: 'stopped' });

    return { reason: 'stopped' };
  };

  context.abortSignal?.addEventListener('abort', () => void stop(), { once: true });
  await Promise.all(directory.opened().map(join));

  await match(context.abortSignal?.aborted ?? false)
    .with(true, () => stop())
    .with(false, () => undefined)
    .exhaustive();

  return { state, closed, stop };
}
