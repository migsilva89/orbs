import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeBot } from './runtime.constants';
import type { RuntimeServiceDeps, RuntimeToolTarget } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolExecutionApi } from '@earendil-works/pi-durable';

export async function runtimeToolTarget(api: ToolExecutionApi, context: Context): Promise<RuntimeToolTarget> {
  const identity = await api.snapshot(runtimeBot, api.conversationId, context);

  const botId = match(identity?.botId)
    .with(P.string, (id) => id)
    .otherwise(() => {
      throw new Errors.FORBIDDEN();
    });

  return { botId, conversationId: api.conversationId };
}

export async function runtimeToolBotTarget(deps: Pick<RuntimeServiceDeps, 'harness'>, api: ToolExecutionApi, context: Context): Promise<RuntimeToolTarget> {
  const { botId } = await runtimeToolTarget(api, context);
  const conversation = await runtimeQueryConversation(deps, { botId, context });

  return { botId, conversationId: conversation.id };
}

export function runtimeToolOutput<T>(value: T) {
  return { output: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}
