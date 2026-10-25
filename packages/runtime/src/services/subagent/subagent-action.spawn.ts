import { match, P } from 'ts-pattern';
import { subagentAnchor } from './subagent-anchor.task';
import { subagentReporter } from './subagent-reporter.task';
import { SUBAGENT, subagentAgents, subagentCall } from './subagent.constants';
import { subagentCreateChild, subagentDetails, subagentPendingReporters, subagentReply } from './subagent.utils';
import type { SubagentMessageParams, SubagentReporterInput, SubagentToolParams } from '../../types/subagent.types';

export async function subagentActionSpawn({ api, context, ...params }: SubagentMessageParams & SubagentToolParams) {
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
          .with(true, () => {
            const existing = state.agents[params.name];
            call.text = `${params.name} already exists; use send.`;
            call.name = params.name;
            call.conversationId = existing.conversationId;

            return { text: call.text, name: call.name, conversationId: call.conversationId };
          })
          .with(false, () => match(pending >= maxBackgroundAgents)
            .with(true, () => {
              call.text = `Cannot run more than ${maxBackgroundAgents} background subagents at once.`;
              return { text: call.text, name: null, conversationId: null };
            })
            .with(false, async () => {
              const background = { ownership: { kind: 'conversation' as const }, background: true };
              const anchor = await tx.createTask(subagentAnchor, null, background);
              const conversationId = await subagentCreateChild(tx, anchor, api.conversationId);
              state.agents[params.name] = { conversationId };

              const input: SubagentReporterInput = {
                name: params.name,
                conversationId,
                message: params.message,
                whenBusy: 'steer',
              };

              await tx.createTask(subagentReporter, input, background);
              call.text = `Started ${params.name}.`;
              call.name = params.name;
              call.conversationId = conversationId;

              return { text: call.text, name: params.name, conversationId };
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
