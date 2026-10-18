import { instructionQueryLoad } from './instruction-query.load';
import { instructionQuerySettings } from './instruction-query.settings';
import type { InstructionBotParams, InstructionServiceDeps } from '../../types/instruction.types';

export async function instructionQueryDiscover(deps: InstructionServiceDeps, params: InstructionBotParams) {
  const settings = await instructionQuerySettings(deps);
  return instructionQueryLoad(deps, { ...params, settings });
}
