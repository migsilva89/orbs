import { commandIdArguments } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { runtimeActionRetry } from './runtime-action.retry';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { JsonValue } from '@earendil-works/chord';
import type { ConversationId, SubmissionId, TaskId } from '@earendil-works/pi-durable';
import type { CommandExecuteInput } from '@repo/contracts/universal';

export async function runtimeActionExecuteCommand(
  deps: RuntimeServiceDeps,
  params: CommandExecuteInput & RuntimeContextInput,
): Promise<void> {
  const { context } = params;

  function runtimeCommandId(value: string | undefined) {
    const parsed = commandIdArguments.safeParse(value);

    return match(parsed)
      .with({ success: true }, ({ data }) => Number(data))
      .otherwise(() => {
        throw new Errors.VALIDATION_ERROR({ fields: { arguments: { message: 'validation_command_id_arguments' } } });
      });
  }

  async function runtimeCommandCancel(conversationId: ConversationId, value: string | undefined) {
    // SAFETY: a submission ID is only a lookup key; abortSubmission reports not_found outside this conversation.
    const id = runtimeCommandId(value) as SubmissionId;

    return match(await deps.harness.abortSubmission(id, context, conversationId))
      .with('aborted', 'settled', () => undefined)
      .with('already_placed', () => {
        throw new Errors.CONFLICT();
      })
      .with('not_found', () => {
        throw new Errors.NOT_FOUND({ resource: 'submission', resourceId: id });
      })
      .exhaustive();
  }

  const conversation = await runtimeQueryConversation(deps, params);

  await match(params.name)
    .with('compact', () => conversation.compact(params.arguments, context))
    .with('reset', () => conversation.reset(params.arguments, context))
    .with('retry', () => runtimeActionRetry(deps, {
      conversationId: conversation.id,
      // SAFETY: a task ID is only a lookup key; retry accepts it only when it is this conversation's latest failed generation.
      taskId: runtimeCommandId(params.arguments) as TaskId<JsonValue>,
      context,
    }))
    .with('cancel', () => runtimeCommandCancel(conversation.id, params.arguments))
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'command', resourceId: params.name });
    });
}
