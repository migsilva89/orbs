import type { SettingsService } from '../services/settings/settings.service';
import type { Bot, SkillSettings } from '@openbots/contracts/universal';
import type { SkillLoaderService } from '@openbots/runtime/server';

export interface SkillServiceDeps {
  settings: SettingsService;
  loader: SkillLoaderService;
}

export interface SkillBotParams {
  bot: Pick<Bot, 'id' | 'inherit'>;
}

export interface SkillLoadParams extends SkillBotParams {
  settings: SkillSettings;
}
