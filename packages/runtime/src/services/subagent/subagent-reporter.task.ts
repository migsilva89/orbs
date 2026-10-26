import { defineTask } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { SUBAGENT } from './subagent.constants';
import { subagentAnswer } from './subagent.utils';
import type { SubagentReporterInput, SubagentReporterState } from '../../types/subagent.types';

export const subagentReporterTask = defineTask<SubagentReporterInput, SubagentReporterState, null>({
  name: SUBAGENT.reporter,
  version: 1,
  initial: () => ({ phase: 'deliver' }),
  phases: {
    deliver: async (task, runtime, context) => {
      const { name, conversationId, message, whenBusy } = task.input;
      const child = await runtime.conversation(conversationId, context);

      const request = {
        type: 'input' as const,
        content: message,
        whenBusy,
        requestId: `${SUBAGENT.request}:${task.id}`,
      };

      const settled = await match(child)
        .with(P.nonNullable, (conversation) => conversation.submit(request, context).then((submission) => (
          submission.wait(context)
        )))
        .otherwise(async () => undefined);

      await runtime.commit(async (tx) => match(settled)
        .with({ status: 'unanswered', reason: 'aborted' }, () => ({
          status: 'running' as const,
          checkpoint: { phase: 'report' as const, report: null },
        }))
        .with({ status: 'unanswered' }, ({ reason }) => ({
          status: 'running' as const,
          checkpoint: { phase: 'report' as const, report: `[Subagent ${name} failed.]\n\n${reason}` },
        }))
        .with({ status: 'done', type: 'input' }, async ({ answer }) => ({
          status: 'running' as const,
          checkpoint: {
            phase: 'report' as const,
            answerId: answer,
            report: `[Subagent ${name} answered. No reply is needed.]\n\n${await subagentAnswer(tx, answer)}`,
          },
        }))
        .otherwise(() => ({
          status: 'running' as const,
          checkpoint: { phase: 'report' as const, report: `[Subagent ${name} failed.]\n\nNo answer was produced.` },
        })), context);
    },
    report: async (task, runtime, context) => {
      const { name, conversationId } = task.input;
      const { report, answerId } = task.state.checkpoint;

      const requestId = match(answerId)
        .with(P.number, (id) => `${SUBAGENT.reportRequest}:${conversationId}:${id}`)
        .otherwise(() => `${SUBAGENT.reportRequest}:${task.id}`);

      await match(report)
        .with(P.string, async (content) => {
          const parent = await runtime.conversation(runtime.conversationId, context);
          await match(parent)
            .with(P.nonNullable, (conversation) => conversation.submit({
              type: 'input',
              content,
              whenBusy: 'followUp',
              requestId,
              entry: {
                kind: SUBAGENT.report,
                data: match(answerId)
                  .with(P.number, () => ({ name, conversationId, status: 'answered' as const }))
                  .otherwise(() => ({ name, conversationId, status: 'failed' as const })),
              },
            }, context))
            .otherwise(() => undefined);
        })
        .otherwise(() => undefined);

      await runtime.commit(() => ({ status: 'terminal', outcome: { status: 'completed', result: null } }), context);
    },
  },
  abort: (_task, runtime, context) => runtime.commit(
    () => ({ status: 'terminal', outcome: { status: 'aborted' } }),
    context,
  ),
});
