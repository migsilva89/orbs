import type { SettingsService } from '../services/settings/settings.service';
import type { Bot, InstructionSettings } from '@openbots/contracts/universal';
import type { InstructionLoaderService } from '@openbots/runtime/server';

export interface InstructionServiceDeps {
  settings: SettingsService;
  loader: InstructionLoaderService;
}

export interface InstructionBotParams {
  bot: Pick<Bot, 'id' | 'inherit'>;
}

export interface InstructionLoadParams extends InstructionBotParams {
  settings: InstructionSettings;
}
