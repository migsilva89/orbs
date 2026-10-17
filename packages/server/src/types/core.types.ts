import type { DatabaseService } from '../services/database/database.service';
import type { McpService } from './mcp.types';
import type { SkillService } from './skill.types';
import type { WorkspaceService } from './workspace.types';
import type { RuntimeServiceParams } from '@openbots/runtime/server';

export interface CoreServicesParams {
  database: DatabaseService;
  credentialsKey: CryptoKey;
  workspace: WorkspaceService;
  skill: SkillService;
  mcp: McpService;
  runtime: Omit<RuntimeServiceParams, 'permissions'>;
}
