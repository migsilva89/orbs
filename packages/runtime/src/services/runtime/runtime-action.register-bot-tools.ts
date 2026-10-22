import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { runtimeBotToolsExtension } from './runtime-bot-tools.extension';
import type { RuntimeRegisterBotToolsDeps, RuntimeRegisterBotToolsParams } from '../../types/runtime-bot-tools.types';

/** Shared bot-management tools; every bot store installs them when it opens, so register before restoring bots. */
export function runtimeActionRegisterBotTools(deps: RuntimeRegisterBotToolsDeps, { bots }: RuntimeRegisterBotToolsParams) {
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
