import type { DatabaseService } from '../services/database/database.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { SettingsService } from '../services/settings/settings.service';
import type { WorkspaceService } from '../services/workspace/workspace.service';
import type { RuntimeServiceParams, SkillLoaderService } from '@openbots/runtime/server';

export interface CoreServicesParams {
  database: DatabaseService;
  credentialsKey: CryptoKey;
  settings: SettingsService;
  workspace: WorkspaceService;
  skillLoader: SkillLoaderService;
  mcp: McpService;
  runtime: Omit<RuntimeServiceParams, 'permissions'>;
}
