import { instructionQueryLoad } from './instruction-query.load';
import type { InstructionLoaderServiceDeps, InstructionLoadParams } from '../../types/instruction.types';

export function makeInstructionLoaderService(deps: InstructionLoaderServiceDeps) {
  return {
    queries: {
      load: (params: InstructionLoadParams) => instructionQueryLoad(deps, params),
    },
  };
}

export type InstructionLoaderService = ReturnType<typeof makeInstructionLoaderService>;
