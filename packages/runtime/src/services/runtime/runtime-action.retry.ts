import { GenerationTask, InboxDoc, LiveDoc } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { JsonValue } from '@earendil-works/chord';
import type { Context } from '@earendil-works/chord/context';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export async function runtimeActionRetry(
  { harness }: RuntimeServiceDeps,
  conversationId: PiDurableTypes.ConversationId,
  taskId: PiDurableTypes.TaskId<JsonValue>,
  context: Context,
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

    match(live.run !== undefined || inbox.items.some((item) => item.mode === 'write' && 'head' in item.entry))
      .with(true, () => {
        throw new Errors.CONFLICT();
      })
      .with(false, () => undefined)
      .exhaustive();

    // Pi has no retry action. Start its native generation against saved context, without duplicating input.
    live.run = {
      taskId: await tx.createTask(GenerationTask, {}, { conversationId, ownership: { kind: 'conversation' } }),
      inputs: [],
    };
  }, context);

  harness.resume();
}
