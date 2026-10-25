import { match, P } from 'ts-pattern';
import { subagentAgents } from './subagent.constants';
import { subagentDetails, subagentReply } from './subagent.utils';
import type { SubagentStopParams } from '../../types/subagent.types';

export async function subagentActionStop({ api, name, context }: SubagentStopParams) {
  const agents = (await api.snapshot(subagentAgents, api.conversationId, context))?.agents ?? {};

  const agent = match(Object.hasOwn(agents, name))
    .with(true, () => agents[name])
    .with(false, () => undefined)
    .exhaustive();

  return match(agent)
    .with(P.nonNullable, async ({ conversationId }) => {
      const child = await api.conversation(conversationId, context);
      await match(child)
        .with(P.nonNullable, (conversation) => conversation.abort(context))
        .otherwise(() => undefined);

      return subagentReply(`Stopped ${name}.`, subagentDetails(conversationId, api.taskId, name));
    })
    .otherwise(() => subagentReply(`No subagent named ${name}.`, undefined, true));
}
