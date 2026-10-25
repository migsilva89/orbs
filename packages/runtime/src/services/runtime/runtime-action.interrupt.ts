import { GenerationTask, LiveDoc, UserEntry } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { RuntimeInterruptParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export async function runtimeActionInterrupt(
  deps: RuntimeServiceDeps,
  { conversationId, context, ...params }: RuntimeInterruptParams,
): Promise<PiDurableTypes.Submission> {
  async function runtimeInterruptStopRun(
    taskId: PiDurableTypes.TaskId | undefined,
    anchor: PiDurableTypes.SubmissionId | undefined,
  ) {
    await match(taskId)
      .with(P.number, async (aborted) => {
        await deps.harness.abortTask(aborted, context);
        await deps.harness.waitForTask(aborted, context);
        const live = await deps.harness.snapshot(LiveDoc, conversationId, context);

        const next = match(live?.run)
          .with(P.nullish, () => undefined)
          .otherwise((run) => match(run.taskId !== aborted && anchor !== undefined && run.inputs.includes(anchor))
            .with(true, () => run.taskId)
            .with(false, () => undefined)
            .exhaustive());

        await runtimeInterruptStopRun(next, anchor);
      })
      .otherwise(() => undefined);
  }

  async function runtimeInterruptAdmit(tx: PiDurableTypes.Tx) {
    const existing = await tx.submissionByRequest(conversationId, params.requestId);

    return match(existing)
      .with({ id: P.number }, ({ id }) => id)
      .otherwise(async () => {
        const live = await tx.doc(LiveDoc, conversationId);

        match(live.run)
          .with(P.nullish, () => undefined)
          .otherwise(() => {
            throw new Errors.CONFLICT();
          });

        const model = [{ role: 'user' as const, content: params.content, timestamp: Date.now() }];

        const entry = await match(params.entry)
          .with(P.nonNullable, (value) => tx.appendEntry(conversationId, { ...value, model }))
          .otherwise(() => tx.appendEntry(UserEntry, conversationId, { model }));

        const submission = await tx.createSubmission({
          conversationId,
          requestId: params.requestId,
          type: 'input',
          status: 'placed',
          entry: entry.id,
        });

        const next = await tx.createTask(GenerationTask, {}, {
          ownership: { kind: 'conversation' },
          conversationId,
        });

        live.run = { taskId: next, inputs: [submission.id] };

        return submission.id;
      });
  }

  async function runtimeInterruptSubmission(id: PiDurableTypes.SubmissionId) {
    const submission = await deps.harness.submission(id, context);

    return match(submission)
      .with(P.nonNullable, (value) => value)
      .otherwise(() => {
        throw new Errors.INTERNAL_ERROR({ internal: 'Interrupt submission is missing from runtime storage' });
      });
  }

  const captured = await deps.harness.commit(async (tx) => {
    const existing = await tx.submissionByRequest(conversationId, params.requestId);

    return match(existing)
      .with({ id: P.number }, ({ id }) => ({ existingId: id }))
      .otherwise(async () => {
        const live = await tx.doc(LiveDoc, conversationId);

        return { taskId: live.run?.taskId, anchor: live.run?.inputs[0] };
      });
  }, context);

  return match(captured)
    .with({ existingId: P.number }, ({ existingId }) => runtimeInterruptSubmission(existingId))
    .otherwise(async ({ taskId, anchor }) => {
      await runtimeInterruptStopRun(taskId, anchor);
      const id = await deps.harness.commit((tx) => runtimeInterruptAdmit(tx), context);

      deps.harness.resume();

      return runtimeInterruptSubmission(id);
    });
}
