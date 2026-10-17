import type { DatabaseService } from '../services/database/database.service';
import type { ResourceService } from '../services/resource/resource.service';
import type { McpService } from './mcp.types';
import type { SkillService } from './skill.types';
import type { WorkspaceService } from './workspace.types';
import type { RuntimeService } from '@openbots/runtime/server';

export interface BotDatabaseDeps {
  database: DatabaseService;
}

export interface BotServiceDeps extends BotDatabaseDeps {
  runtime: RuntimeService;
  workspace: WorkspaceService;
  skill: SkillService;
  mcp: McpService;
  resources: ResourceService;
  configurations: Map<string, Promise<void>>;
}
