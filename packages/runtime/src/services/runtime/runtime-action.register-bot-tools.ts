import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import { runtimeBotToolsExtension } from './runtime-bot-tools.utils';
import type { RuntimeRegisterBotToolsDeps, RuntimeRegisterBotToolsParams } from '../../types/runtime-bot-tools.types';

export function runtimeActionRegisterBotTools(deps: RuntimeRegisterBotToolsDeps, { bots }: RuntimeRegisterBotToolsParams) {
  match(deps.extensions.some((extension) => extension.name === 'openbots.bot-tools'))
    .with(true, () => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Bot tools are already registered.' });
    })
    .with(false, () => undefined)
    .exhaustive();

  const tools = runtimeBotToolsExtension({ bots, models: deps.models });
  deps.extensions.splice(deps.extensions.length - 1, 0, tools.extension);
  deps.readOnlyTools.push(...tools.readOnlyTools);
  deps.registry.install(tools.extension);
}
