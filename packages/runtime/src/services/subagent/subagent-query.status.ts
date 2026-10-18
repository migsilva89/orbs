import { LiveDoc } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { subagentAgents } from './subagent.constants';
import { subagentDetails, subagentReply } from './subagent.utils';
import type { Context } from '@earendil-works/chord/context';
import type { ToolExecutionApi } from '@earendil-works/pi-durable';

export async function subagentQueryStatus(
  api: ToolExecutionApi,
  name: string | undefined,
  context: Context,
) {
  const agents = (await api.snapshot(subagentAgents, api.conversationId, context))?.agents ?? {};

  const names = match(name)
    .with(P.string, (value) => [value])
    .otherwise(() => Object.keys(agents));

  const listed = names.flatMap((each) => match(Object.hasOwn(agents, each))
    .with(true, () => [{ name: each, conversationId: agents[each].conversationId }])
    .with(false, () => [])
    .exhaustive());

  const lines = await Promise.all(listed.map(async (agent) => {
    const isBusy = (await api.snapshot(LiveDoc, agent.conversationId, context))?.run !== undefined;
    const status = match(isBusy).with(true, () => 'working').with(false, () => 'idle').exhaustive();
    return `${agent.name}: ${status}`;
  }));

  return subagentReply(
    match(lines.length)
      .with(0, () => 'No subagents.')
      .otherwise(() => lines.join('\n')),
    match(name)
      .with(P.string, () => match(listed[0])
        .with(P.nonNullable, (agent) => subagentDetails(agent.conversationId, api.taskId, agent.name))
        .otherwise(() => undefined))
      .otherwise(() => undefined),
  );
}
