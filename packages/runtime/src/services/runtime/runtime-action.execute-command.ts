import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { CommandExecuteInput } from '@openbots/contracts/universal';

export async function runtimeActionExecuteCommand(
  deps: RuntimeServiceDeps,
  params: CommandExecuteInput,
  context: Context,
): Promise<void> {
  const conversation = await runtimeQueryConversation(deps, params, context);

  await match(params.name)
    .with('compact', () => conversation.compact(params.arguments, context))
    .with('reset', () => conversation.reset(params.arguments, context))
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'command', resourceId: params.name });
    });
}
