import { replicatedState } from '@earendil-works/chord';
import { log } from '@repo/logger/server';
import { match } from 'ts-pattern';
import type { RuntimeBot, RuntimeWatchMergeParams, RuntimeWatchSource } from '../../types/runtime.types';
import type { WatchEnd } from '@earendil-works/pi-durable';

export async function runtimeWatchMerge<T, S extends object>({ directory, initial, attach, apply, context }: RuntimeWatchMergeParams<T, S>) {
  const state = replicatedState<S>(initial);
  const sources = new Map<string, { source: RuntimeWatchSource<T>; unsubscribe: () => void }>();
  let isStopped = false;
  let runtimeWatchMergeFinish: (end: WatchEnd) => void = () => undefined;

  const closed = new Promise<WatchEnd>((resolve) => {
    runtimeWatchMergeFinish = resolve;
  });

  const runtimeWatchMergeRemove = (botId: string, source?: RuntimeWatchSource<T>) => {
    const entry = sources.get(botId);

    match(entry !== undefined && (source === undefined || entry.source === source))
      .with(true, () => {
        sources.delete(botId);
        entry?.unsubscribe();

        match(isStopped)
          .with(true, () => undefined)
          .with(false, () => state.change(context, (draft) => apply(draft, botId, null)))
          .exhaustive();
      })
      .with(false, () => undefined)
      .exhaustive();
  };

  const runtimeWatchMergeAdd = async (bot: RuntimeBot) => {
    const { botId } = bot.deps;

    await match(sources.has(botId) || isStopped)
      .with(true, () => undefined)
      .with(false, async () => {
        const source = await attach(bot, context);

        await match(isStopped)
          .with(true, () => source.stop())
          .with(false, () => {
            const unsubscribe = source.state.subscribe((value) => {
              state.change(context, (draft) => apply(draft, botId, value));
            });

            sources.set(botId, { source, unsubscribe });
            state.change(context, (draft) => apply(draft, botId, source.state.value));

            void source.closed.then(() => {
              runtimeWatchMergeRemove(botId, source);

              match(directory.opened().includes(bot))
                .with(true, () => void runtimeWatchMergeJoin(bot))
                .with(false, () => undefined)
                .exhaustive();
            });
          })
          .exhaustive();
      })
      .exhaustive();
  };

  const runtimeWatchMergeJoin = (bot: RuntimeBot) => runtimeWatchMergeAdd(bot)
    .catch((error: unknown) => match(isStopped || context.abortSignal?.aborted === true)
      .with(true, () => undefined)
      .with(false, () => log.error({
        tag: 'runtime-watch',
        message: 'Cannot attach a bot watch.',
        botId: bot.deps.botId,
        error,
      }))
      .exhaustive());

  const unlisten = directory.onChange((change) => match(change)
    .with({ type: 'opened' }, ({ bot }) => void runtimeWatchMergeJoin(bot))
    .with({ type: 'closed' }, ({ botId }) => runtimeWatchMergeRemove(botId))
    .exhaustive());

  const runtimeWatchMergeStop = async (): Promise<WatchEnd> => {
    isStopped = true;
    unlisten();
    const entries = [...sources.values()];
    sources.clear();
    await Promise.all(entries.map(({ source, unsubscribe }) => {
      unsubscribe();
      return source.stop();
    }));
    runtimeWatchMergeFinish({ reason: 'stopped' });

    return { reason: 'stopped' };
  };

  context.abortSignal?.addEventListener('abort', () => void runtimeWatchMergeStop(), { once: true });
  await Promise.all(directory.opened().map(runtimeWatchMergeJoin));

  await match(context.abortSignal?.aborted ?? false)
    .with(true, () => runtimeWatchMergeStop())
    .with(false, () => undefined)
    .exhaustive();

  return { state, closed, stop: runtimeWatchMergeStop };
}
