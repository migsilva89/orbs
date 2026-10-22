import { commandIdArguments } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { runtimeActionRetry } from './runtime-action.retry';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { JsonValue } from '@earendil-works/chord';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationId, SubmissionId, TaskId } from '@earendil-works/pi-durable';
import type { CommandExecuteInput } from '@repo/contracts/universal';

export async function runtimeActionExecuteCommand(
  deps: RuntimeServiceDeps,
  params: CommandExecuteInput,
  context: Context,
): Promise<void> {
  const conversation = await runtimeQueryConversation(deps, params, context);

  await match(params.name)
    .with('compact', () => conversation.compact(params.arguments, context))
    .with('reset', () => conversation.reset(params.arguments, context))
    .with('retry', () => runtimeActionRetry(deps, conversation.id, runtimeCommandId(params.arguments) as TaskId<JsonValue>, context))
    .with('cancel', () => runtimeActionExecuteCancel(deps, conversation.id, params.arguments, context))
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'command', resourceId: params.name });
    });
}

async function runtimeActionExecuteCancel(
  { harness }: RuntimeServiceDeps,
  conversationId: ConversationId,
  value: string | undefined,
  context: Context,
) {
  const id = runtimeCommandId(value) as SubmissionId;

  return match(await harness.abortSubmission(id, context, conversationId))
    .with('aborted', 'settled', () => undefined)
    .with('already_placed', () => {
      throw new Errors.CONFLICT();
    })
    .with('not_found', () => {
      throw new Errors.NOT_FOUND({ resource: 'submission', resourceId: id });
    })
    .exhaustive();
}

function runtimeCommandId(value: string | undefined) {
  const parsed = commandIdArguments.safeParse(value);

  return match(parsed)
    .with({ success: true }, ({ data }) => Number(data))
    .otherwise(() => {
      throw new Errors.VALIDATION_ERROR({ fields: { arguments: { message: 'validation_command_id_arguments' } } });
    });

}
