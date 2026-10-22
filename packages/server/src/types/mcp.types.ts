import type { CredentialsService } from '../services/credentials/credentials.service';
import type { SettingsService } from '../services/settings/settings.service';
import type { Bot, McpSettings } from '@repo/contracts/universal';
import type { McpClientService } from '@repo/runtime/server';

export interface McpServiceDeps {
  root: string;
  settings: SettingsService;
  clients: McpClientService;
  credentials: CredentialsService;
}

export interface McpBotParams {
  bot: Pick<Bot, 'id' | 'inherit'>;
}

export interface McpPrepareParams extends McpBotParams {
  settings: McpSettings;
}

export interface McpTargetParams extends McpBotParams {
  name: string;
}

export interface McpConfigParams {
  botId: string;
  paths: string[];
  isInherited: boolean;
}
