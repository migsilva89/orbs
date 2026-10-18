import { match } from 'ts-pattern';
import { instructionQuerySettings } from './instruction-query.settings';
import { INSTRUCTION } from './instruction.constants';
import type { InstructionServiceDeps } from '../../types/instruction.types';
import type { InstructionConfigureInput } from '@openbots/contracts/universal';

export async function instructionActionConfigure(deps: InstructionServiceDeps, { paths }: InstructionConfigureInput) {
  await match(paths)
    .with(undefined, () => undefined)
    .otherwise((value) => deps.settings.actions.set({
      records: [{
        key: INSTRUCTION.pathsSetting,
        value: JSON.stringify(value),
      }],
    }));

  return instructionQuerySettings(deps);
}
