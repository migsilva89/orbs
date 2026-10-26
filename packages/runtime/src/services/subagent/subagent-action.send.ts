import { match, P } from 'ts-pattern';
import { subagentReporterTask } from './subagent-reporter.task';
import { SUBAGENT, subagentAgents, subagentCall } from './subagent.constants';
import { subagentDetails, subagentPendingReporters, subagentReply } from './subagent.utils';
import type { SubagentMessageParams, SubagentReporterInput, SubagentToolParams } from '../../types/subagent.types';

export async function subagentActionSend({ api, context, ...params }: SubagentMessageParams & SubagentToolParams) {
  const { maxBackgroundAgents } = SUBAGENT;

  const result = await api.commit(async (tx) => {
    await tx.conversation(api.conversationId);
    await tx.task(api.taskId);
    const call = await tx.doc(subagentCall, api.taskId);

    return match(call.text)
      .with(P.string, (text) => ({ text, name: call.name, conversationId: call.conversationId }))
      .otherwise(async () => {
        const state = await tx.doc(subagentAgents, api.conversationId);
        const pending = await subagentPendingReporters(tx, api.conversationId, maxBackgroundAgents);

        return match(Object.hasOwn(state.agents, params.name))
          .with(false, () => {
            call.text = `No subagent named ${params.name}.`;
            return { text: call.text, name: null, conversationId: null };
          })
          .with(true, () => match(pending >= maxBackgroundAgents)
            .with(true, () => {
              call.text = `Cannot start more than ${maxBackgroundAgents} background subagents.`;
              return { text: call.text, name: null, conversationId: null };
            })
            .with(false, async () => {
              const existing = state.agents[params.name];

              const input: SubagentReporterInput = {
                name: params.name,
                conversationId: existing.conversationId,
                message: params.message,
                whenBusy: match(params.whenBusy)
                  .with('followUp', () => 'followUp' as const)
                  .otherwise(() => 'steer' as const),
              };

              await tx.createTask(subagentReporterTask, input, { ownership: { kind: 'conversation' }, background: true });
              call.text = `Sent to ${params.name}.`;
              call.name = params.name;
              call.conversationId = existing.conversationId;

              return { text: call.text, name: params.name, conversationId: existing.conversationId };
            })
            .exhaustive())
          .exhaustive();
      });
  }, context);

  return match(result.conversationId)
    .with(P.nonNullable, (conversationId) => (
      subagentReply(result.text, subagentDetails(conversationId, api.taskId, result.name))
    ))
    .otherwise(() => subagentReply(result.text, undefined, true));
}
