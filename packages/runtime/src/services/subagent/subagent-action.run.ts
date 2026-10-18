import { match, P } from 'ts-pattern';
import { SUBAGENT } from './subagent.constants';
import { subagentAnswer, subagentCreateChild, subagentDetails, subagentReply } from './subagent.utils';
import type { Context } from '@earendil-works/chord/context';
import type { ToolExecutionApi } from '@earendil-works/pi-durable';

export async function subagentActionRun(
  api: ToolExecutionApi,
  message: string,
  context: Context,
) {
  const child = await api.commit(async (tx) => {
    await tx.conversation(api.conversationId);
    await tx.task(api.taskId);
    const owned = await tx.scanConversations({ ownerTaskId: api.taskId }, 1);

    return match(owned.items.length)
      .with(0, () => subagentCreateChild(tx, api.taskId, api.conversationId))
      .otherwise(() => owned.items[0].id);
  }, context);

  const details = subagentDetails(child, api.taskId);
  await api.details(details, context);
  const handle = await api.conversation(child, context);

  const settled = await match(handle)
    .with(P.nonNullable, (conversation) => conversation.submit({
      type: 'input',
      content: message,
      requestId: `${SUBAGENT.request}:${api.taskId}`,
    }, context).then((submission) => submission.wait(context)))
    .otherwise(async () => undefined);

  context.abortSignal?.throwIfAborted();

  return match(settled)
    .with({ status: 'done', type: 'input' }, async ({ answer }) => (
      subagentReply(await api.commit((tx) => subagentAnswer(tx, answer), context), details)
    ))
    .with({ status: 'unanswered', reason: 'aborted' }, () => (
      subagentReply('Subagent was stopped.', details, true)
    ))
    .with({ status: 'unanswered' }, ({ reason }) => (
      subagentReply(`Subagent failed: ${reason}`, details, true)
    ))
    .otherwise(() => subagentReply('Subagent failed.', details, true));
}
