import { GenerationTask, InboxDoc, LiveDoc } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeRetryParams, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeActionRetry(
  { harness }: RuntimeServiceDeps,
  { conversationId, taskId, context }: RuntimeRetryParams,
) {
  await harness.commit(async (tx) => {
    const tasks = await tx.scanTasks({
      conversationId,
      kind: GenerationTask.definition.name,
      order: 'descending',
    }, 1);

    const task = tasks.items[0];
    const live = await tx.doc(LiveDoc, conversationId);
    const inbox = await tx.doc(InboxDoc, conversationId);

    match(task)
      .with({ id: taskId, state: { status: 'terminal', outcome: { status: P.union('failed', 'faulted', 'aborted') } } }, () => undefined)
      .otherwise(() => {
        throw new Errors.CONFLICT();
      });

    match(live.run !== undefined || inbox.items.some((item) => item.mode === 'write' && Object.hasOwn(item.entry, 'head')))
      .with(true, () => {
        throw new Errors.CONFLICT();
      })
      .with(false, () => undefined)
      .exhaustive();

    live.run = {
      taskId: await tx.createTask(GenerationTask, {}, { conversationId, ownership: { kind: 'conversation' } }),
      inputs: [],
    };
  }, context);

  harness.resume();
}
