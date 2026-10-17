import { defineExtension, hook, ToolTask } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { runtimeActionRequestApproval } from './runtime-action.request-approval';
import { runtimeBot } from './runtime.constants';
import type { RuntimeToolsDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { Conversation } from '@earendil-works/pi-durable';

export function runtimeToolsExtension({ harness, readOnlyTools, permissions }: RuntimeToolsDeps) {
  return defineExtension({
    name: 'openbots.tools',
    hooks: [hook(ToolTask, {
      beforeTool: async (call, api, context) => {
        const bot = await api.snapshot(runtimeBot, api.conversationId, context);

        return match(bot?.botId)
          .with(P.string, async (botId) => {
            const conversation = await harness.conversation(api.conversationId, context);
            const agent = await conversation?.agent(context);
            const tools = [...(agent?.tools ?? []), ...(agent?.callable ?? []), ...(agent?.deferred ?? [])];
            const tool = tools.find((candidate) => candidate.name === call.name);

            const input = {
              botId,
              taskId: api.taskId,
              name: call.name,
              arguments: call.arguments,
              isReadOnly: tool !== undefined && readOnlyTools.includes(tool),
              getRequest: () => runtimeToolsRequest(conversation, context),
            };

            const decision = await permissions.authorize(input, context);

            context.abortSignal?.throwIfAborted();

            const allowed = await match(decision)
              .with('allow', () => true)
              .with('deny', () => false)
              .with('ask', async () => {
                const approved = await runtimeActionRequestApproval({ harness }, {
                  call: input,
                  taskId: api.taskId,
                  context,
                });

                return approved && await permissions.authorize({ ...input, approved: true }, context) === 'allow';
              })
              .exhaustive();

            return match(allowed)
              .with(true, () => undefined)
              .with(false, () => ({ block: 'Tool permission was denied or expired.' }))
              .exhaustive();
          })
          .otherwise(() => ({ block: 'This conversation has no bot identity.' }));
      },
    })],
  });
}

async function runtimeToolsRequest(conversation: Conversation | undefined, context: Context): Promise<string> {
  const view = await conversation?.context(context);
  const message = [...(view?.messages ?? [])].reverse().find((item) => item.role === 'user');

  return match(message?.content)
    .with(P.string, (text) => text)
    .with(P.array(), (parts) => parts.flatMap((part) => (
      match(part)
        .with({ type: 'text' }, ({ text }) => [text])
        .otherwise(() => [])
    )).join('\n'))
    .otherwise(() => '');
}
