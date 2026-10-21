import type { CredentialsService } from '../services/credentials/credentials.service';
import type { DatabaseService } from '../services/database/database.service';
import type { SettingsService } from '../services/settings/settings.service';
import type { Context } from '@earendil-works/chord/context';
import type { ToolSettings } from '@openbots/contracts/universal';
import type { RuntimeToolCall } from '@openbots/runtime/server';

export interface ToolServiceDeps {
  database: DatabaseService;
  credentials: CredentialsService;
  settings: SettingsService;
}

export interface ToolAlwaysAllowedParams {
  botId: string;
}

export interface ToolAllowAlwaysParams extends ToolAlwaysAllowedParams {
  toolName: string;
}

export interface ToolAuthorizeParams extends RuntimeToolCall {
  context: Context;
}

export interface ToolJudgeParams extends ToolAuthorizeParams {
  instructions: string;
  approvalRules: ToolSettings['approvalRules'];
}
