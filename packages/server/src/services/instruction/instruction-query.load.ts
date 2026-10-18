import type { InstructionLoadParams, InstructionServiceDeps } from '../../types/instruction.types';

export function instructionQueryLoad(deps: InstructionServiceDeps, { bot, settings }: InstructionLoadParams) {
  return deps.loader.queries.load({
    botId: bot.id,
    paths: settings.paths,
    isInherited: bot.inherit.includes('agentsFile'),
  });
}
