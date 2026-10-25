import { match } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeToolApproval } from './runtime.constants';
import type { RuntimeApprovalAnswer, RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { TaskId } from '@earendil-works/pi-durable';

export async function runtimeActionApprove(
  deps: RuntimeServiceDeps,
  params: RuntimeApprovalAnswer & RuntimeContextInput,
) {
  const { context } = params;
  await runtimeQueryConversation(deps, { botId: params.botId, context });
  // SAFETY: an approval ID is only a lookup key; it is accepted only for a running tool task with this bot's pending approval.
  const taskId = params.id as TaskId;

  return deps.harness.commit(async (tx) => {
    const task = await tx.task(taskId);

    return match(task)
      .with({
        kind: 'pi.tool',
        abortRequested: false,
        state: { status: 'running' },
      }, async () => {
        const doc = await tx.doc(runtimeToolApproval, taskId);
        const now = Date.now();

        return match(doc.approval)
          .with({ botId: params.botId, status: 'pending' }, (approval) => {
            const accepted = approval.expiresAt > now;

            const status = match({ accepted, approved: params.approved })
              .with({ accepted: false }, () => 'expired' as const)
              .with({ approved: true }, () => 'allowed' as const)
              .otherwise(() => 'denied' as const);

            doc.approval = {
              ...approval,
              status,
              answeredAt: now,
              answeredBy: params.answeredBy,
            };

            return { accepted };
          })
          .otherwise(() => ({ accepted: false }));
      })
      .otherwise(() => ({ accepted: false }));
  }, context);
}
