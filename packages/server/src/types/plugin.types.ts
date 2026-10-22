import type { SettingsService } from '../services/settings/settings.service';
import type { Bot, PluginSettings } from '@repo/contracts/universal';
import type { PluginLoaderService } from '@repo/runtime/server';

export interface PluginServiceDeps {
  settings: SettingsService;
  loader: PluginLoaderService;
}

export interface PluginBotParams {
  bot: Pick<Bot, 'id' | 'inherit'>;
}

export interface PluginLoadParams extends PluginBotParams {
  settings: PluginSettings;
}
