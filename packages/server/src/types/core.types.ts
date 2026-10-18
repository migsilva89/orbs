import type { DatabaseService } from '../services/database/database.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { SettingsService } from '../services/settings/settings.service';
import type { WorkspaceService } from '../services/workspace/workspace.service';
import type * as ServerTypes from '@openbots/runtime/server';

export interface CoreServicesParams {
  database: DatabaseService;
  credentialsKey: CryptoKey;
  settings: SettingsService;
  workspace: WorkspaceService;
  skillLoader: ServerTypes.SkillLoaderService;
  instructionLoader: ServerTypes.InstructionLoaderService;
  pluginLoader: ServerTypes.PluginLoaderService;
  mcp: McpService;
  runtime: Omit<ServerTypes.RuntimeServiceParams, 'permissions' | 'collaboration'>;
}
