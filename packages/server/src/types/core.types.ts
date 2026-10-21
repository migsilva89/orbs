import type { AttachmentStorageService } from '../services/attachment/attachment-storage.service';
import type { AvatarImageService } from '../services/avatar/avatar-image.service';
import type { CredentialsService } from '../services/credentials/credentials.service';
import type { DatabaseService } from '../services/database/database.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { SettingsService } from '../services/settings/settings.service';
import type { WorkspaceService } from '../services/workspace/workspace.service';
import type * as ServerTypes from '@openbots/runtime/server';

export interface CoreServicesParams {
  database: DatabaseService;
  attachmentStorage: AttachmentStorageService;
  avatarImages: AvatarImageService;
  credentials: CredentialsService;
  settings: SettingsService;
  workspace: WorkspaceService;
  skillLoader: ServerTypes.SkillLoaderService;
  instructionLoader: ServerTypes.InstructionLoaderService;
  pluginLoader: ServerTypes.PluginLoaderService;
  mcp: McpService;
  mcpAuth: ServerTypes.McpAuthService;
  providers: ServerTypes.ProviderService;
  runtime: Omit<ServerTypes.RuntimeServiceParams, 'permissions' | 'collaboration'>;
}
