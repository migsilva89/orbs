import type { SettingsService } from '../services/settings/settings.service';
import type { Bot, McpSettings } from '@openbots/contracts/universal';
import type { McpClientService } from '@openbots/runtime/server';

export interface McpServiceDeps {
  root: string;
  settings: SettingsService;
  clients: McpClientService;
}

export interface McpBotParams {
  bot: Pick<Bot, 'id' | 'inherit'>;
}

export interface McpPrepareParams extends McpBotParams {
  settings: McpSettings;
}

export interface McpConfigParams {
  botId: string;
  paths: string[];
  isInherited: boolean;
}
