import type { DatabaseService } from '../services/database/database.service';
import type { InstructionService } from '../services/instruction/instruction.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { PluginService } from '../services/plugin/plugin.service';
import type { SkillService } from '../services/skill/skill.service';
import type { WorkspaceService } from '../services/workspace/workspace.service';
import type * as UniversalTypes from '@openbots/contracts/universal';
import type { RuntimeService } from '@openbots/runtime/server';

export interface BotDatabaseDeps {
  database: DatabaseService;
}

export interface BotServiceDeps extends BotDatabaseDeps {
  runtime: RuntimeService;
  workspace: WorkspaceService;
  skill: SkillService;
  plugin: PluginService;
  instruction: InstructionService;
  mcp: McpService;
  changes: Set<BotChangeListener>;
  configurations: Map<string, Promise<void>>;
}

export interface BotConfiguration {
  bot: UniversalTypes.Bot;
  skillSettings: UniversalTypes.SkillSettings;
  mcpSettings: UniversalTypes.McpSettings;
  instructionSettings: UniversalTypes.InstructionSettings;
  pluginSettings: UniversalTypes.PluginSettings;
}

export type BotChangeListener = () => void;
