import { instructionSettings } from '@repo/contracts/universal';
import { INSTRUCTION } from './instruction.constants';
import type { InstructionServiceDeps } from '../../types/instruction.types';

export async function instructionQuerySettings({ settings }: InstructionServiceDeps) {
  const stored = await settings.queries.get({ keys: [INSTRUCTION.pathsSetting] });
  const record = stored.find(({ key }) => key === INSTRUCTION.pathsSetting);

  return instructionSettings.parse({
    paths: record === undefined ? INSTRUCTION.defaults.paths : JSON.parse(record.value),
  });
}
