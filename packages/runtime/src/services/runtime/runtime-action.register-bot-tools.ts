import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { runtimeBotToolsExtension } from './runtime-bot-tools.extension';
import type { RuntimeBotToolsRegisterDeps, RuntimeBotToolsRegisterParams } from '../../types/runtime-bot-tools.types';

export function runtimeActionRegisterBotTools(deps: RuntimeBotToolsRegisterDeps, { bots }: RuntimeBotToolsRegisterParams) {
  match(deps.extensions.some((extension) => extension.name === 'bots.bot-tools'))
    .with(true, () => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Bot tools are already registered.' });
    })
    .with(false, () => undefined)
    .exhaustive();

  const tools = runtimeBotToolsExtension({ bots, models: deps.models });
  deps.extensions.push(tools.extension);
  deps.readOnlyTools.push(...tools.readOnlyTools);
}
