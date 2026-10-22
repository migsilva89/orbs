import { instructionActionConfigure } from './instruction-action.configure';
import { instructionQueryDiscover } from './instruction-query.discover';
import { instructionQueryLoad } from './instruction-query.load';
import { instructionQuerySettings } from './instruction-query.settings';
import type { InstructionBotParams, InstructionLoadParams, InstructionServiceDeps } from '../../types/instruction.types';
import type { InstructionConfigureInput } from '@repo/contracts/universal';

export function makeInstructionService(deps: InstructionServiceDeps) {
  return {
    actions: {
      configure: (params: InstructionConfigureInput) => instructionActionConfigure(deps, params),
    },
    queries: {
      settings: () => instructionQuerySettings(deps),
      load: (params: InstructionLoadParams) => instructionQueryLoad(deps, params),
      discover: (params: InstructionBotParams) => instructionQueryDiscover(deps, params),
    },
  };
}

export type InstructionService = ReturnType<typeof makeInstructionService>;
