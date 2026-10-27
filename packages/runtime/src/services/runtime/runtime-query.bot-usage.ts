import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function runtimeQueryBotUsage({ harness }: RuntimeServiceDeps, { context }: BotGetInput & RuntimeContextInput) {
  return harness.usage(context);
}
