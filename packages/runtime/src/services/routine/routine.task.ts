import { defineTask } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { routineScheduleNextRunAt } from './routine-schedule.utils';
import { routineWait } from './routine-wait.utils';
import { ROUTINE, routineDocument } from './routine.constants';
import type { RoutineTaskInput, RoutineTaskState } from '../../types/routine.types';

export const routineTask = defineTask<RoutineTaskInput, RoutineTaskState, null>({
  name: ROUTINE.task,
  version: 1,
  initial: () => ({ phase: 'check' }),
  phases: {
    check: (task, api, context) => api.commit(async (tx) => {
      const doc = await tx.doc(routineDocument, api.conversationId);
      return match(doc.routines[task.input.routineId])
        .with(P.nullish, () => ({ status: 'terminal' as const, outcome: { status: 'completed' as const, result: null } }))
        .otherwise((routine) => {
          const isManual = routine.runRequestedAt !== null;
          const until = routine.runRequestedAt ?? match(routine.isEnabled).with(true, () => routine.nextRunAt).with(false, () => null).exhaustive();
          return match(until)
            .with(P.number.lte(api.now()), (scheduledAt) => {
              routine.occurrence += 1;
              routine.runRequestedAt = null;
              routine.lastRun = {
                occurrence: routine.occurrence,
                scheduledAt,
                startedAt: api.now(),
                finishedAt: null,
                submissionId: null,
                status: 'running',
                reason: null,
              };

              return {
                status: 'running' as const,
                checkpoint: { phase: 'deliver' as const, scheduleRevision: routine.scheduleRevision, occurrence: routine.occurrence, prompt: routine.prompt, isManual },
              };
            })
            .otherwise(() => ({ status: 'running' as const, checkpoint: { phase: 'wait' as const, revision: routine.revision, until } }));
        });
    }, context),
    wait: async (task, api, context) => {
      await routineWait(api, task.input.routineId, task.state.checkpoint, context);
      await api.commit(() => ({ status: 'running', checkpoint: { phase: 'check' } }), context);
    },
    deliver: async (task, api, context) => {
      const checkpoint = task.state.checkpoint;

      const conversation = match(await api.conversation(api.conversationId, context))
        .with(P.nonNullable, (value) => value)
        .otherwise(() => {
          throw new Errors.INTERNAL_ERROR({ internal: 'Routine conversation is missing from runtime storage' });
        });

      const submission = await conversation.submit({
        type: 'input',
        content: checkpoint.prompt,
        whenBusy: 'followUp',
        requestId: `bots.routine:${task.id}:${checkpoint.occurrence}`,
      }, context);

      await api.commit(async (tx) => {
        const doc = await tx.doc(routineDocument, api.conversationId);
        match(doc.routines[task.input.routineId]?.lastRun)
          .with(P.nonNullable, (run) => {
            run.submissionId = submission.id;
          })
          .otherwise(() => undefined);
      }, context);
      const settled = await submission.wait(context);
      await api.commit(async (tx) => {
        const doc = await tx.doc(routineDocument, api.conversationId);
        match(doc.routines[task.input.routineId])
          .with(P.nonNullable, (routine) => {
            const finishedAt = api.now();
            routine.lastRun = {
              occurrence: checkpoint.occurrence,
              scheduledAt: routine.lastRun?.scheduledAt ?? finishedAt,
              startedAt: routine.lastRun?.startedAt ?? finishedAt,
              finishedAt,
              submissionId: submission.id,
              status: match(settled.status).with('done', () => 'done' as const).otherwise(() => 'unanswered' as const),
              reason: match(settled).with({ status: 'unanswered' }, ({ reason }) => reason).otherwise(() => null),
            };
            match(routine.scheduleRevision === checkpoint.scheduleRevision && routine.isEnabled
              && (!checkpoint.isManual || (routine.nextRunAt !== null && routine.nextRunAt <= finishedAt)))
              .with(true, () => {
                match(routine.schedule.kind)
                  .with('once', () => {
                    routine.isEnabled = false;
                    routine.nextRunAt = null;
                  })
                  .otherwise(() => {
                    routine.nextRunAt = routineScheduleNextRunAt(routine.schedule, finishedAt);
                  });
              })
              .with(false, () => undefined)
              .exhaustive();
          })
          .otherwise(() => undefined);

        return { status: 'running', checkpoint: { phase: 'check' } };
      }, context);
    },
  },
  abort: (_task, api, context) => api.commit(() => ({ status: 'terminal', outcome: { status: 'aborted' } }), context),
});
