import type { DatabaseService } from '../services/database/database.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { SkillService } from '../services/skill/skill.service';
import type { WorkspaceService } from '../services/workspace/workspace.service';
import type { RuntimeService } from '@openbots/runtime/server';

export interface BotDatabaseDeps {
  database: DatabaseService;
}

export interface BotServiceDeps extends BotDatabaseDeps {
  runtime: RuntimeService;
  workspace: WorkspaceService;
  skill: SkillService;
  mcp: McpService;
  configurations: Map<string, Promise<void>>;
}
