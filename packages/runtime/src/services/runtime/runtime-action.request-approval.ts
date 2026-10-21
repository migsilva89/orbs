import { copyJson } from '@earendil-works/chord';
import { awaitWithContext } from '@earendil-works/chord/context';
import { match } from 'ts-pattern';
import { runtimeToolApproval } from './runtime.constants';
import type { RuntimeApprovalRequest, RuntimeServiceDeps } from '../../types/runtime.types';
import type { JsonObject } from '@earendil-works/pi-durable';

export async function runtimeActionRequestApproval(
  { harness }: Pick<RuntimeServiceDeps, 'harness'>,
  { call, taskId, timeoutMs, context }: RuntimeApprovalRequest,
): Promise<boolean> {
  const input = copyJson(call.arguments, { omitUndefinedProperties: true }) as JsonObject;

  const approval = await harness.commit(async (tx) => {
    const doc = await tx.doc(runtimeToolApproval, taskId);
    doc.approval ??= {
      id: taskId,
      botId: call.botId,
      toolName: call.name,
      arguments: input,
      createdAt: Date.now(),
      expiresAt: Date.now() + timeoutMs,
      status: 'pending',
      answeredAt: null,
      answeredBy: null,
    };

    return {
      botId: doc.approval.botId,
      toolName: doc.approval.toolName,
      input: JSON.stringify(doc.approval.arguments),
      expiresAt: doc.approval.expiresAt,
    };
  }, context);

  const sameCall = approval.botId === call.botId && approval.toolName === call.name
    && approval.input === JSON.stringify(input);

  return match(sameCall)
    .with(false, () => false)
    .with(true, async () => {
      const watch = await harness.watchDoc(runtimeToolApproval, taskId, context);
      let timer: ReturnType<typeof setTimeout> | undefined;

      try {
        const changed = new Promise<undefined>((resolve) => {
          timer = setTimeout(() => resolve(undefined), Math.max(0, approval.expiresAt - Date.now()));
          watch?.start(async (value) => {
            match(value?.approval?.status)
              .with('pending', () => undefined)
              .otherwise(() => resolve(undefined));
          });
        });

        await match(watch?.value?.approval?.status)
          .with('pending', () => awaitWithContext(changed, context))
          .otherwise(() => undefined);

        return await harness.commit(async (tx) => {
          const doc = await tx.doc(runtimeToolApproval, taskId);

          return match(doc.approval)
            .with({ status: 'pending' }, (pending) => {
              doc.approval = { ...pending, status: 'expired', answeredAt: Date.now() };
              return false;
            })
            .with({ status: 'allowed' }, () => true)
            .otherwise(() => false);
        }, context);
      } finally {
        clearTimeout(timer);
        await watch?.stop();
      }
    })
    .exhaustive();
}
