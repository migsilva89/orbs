import type { DatabaseService } from '../services/database/database.service';
import type { InstructionService } from '../services/instruction/instruction.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { PluginService } from '../services/plugin/plugin.service';
import type { SkillService } from '../services/skill/skill.service';
import type { WorkspaceService } from '../services/workspace/workspace.service';
import type * as UniversalTypes from '@repo/contracts/universal';
import type { RuntimeService } from '@repo/runtime/server';

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
  queues: Map<string, Promise<void>>;
  muteExpiry: { timer: ReturnType<typeof setTimeout> | undefined };
}

export interface BotConfiguration {
  bot: UniversalTypes.Bot;
  skillSettings: UniversalTypes.SkillSettings;
  mcpSettings: UniversalTypes.McpSettings;
  instructionSettings: UniversalTypes.InstructionSettings;
  pluginSettings: UniversalTypes.PluginSettings;
}

export type BotChangeListener = () => void;

export interface BotPreferences {
  isPinned: boolean;
  isHidden: boolean;
  rank: number | null;
  sectionId: string | null;
  isMuted: boolean;
  mutedUntil: number | null;
  readThroughEntryId: number;
  whenBusy: UniversalTypes.ConversationWhenBusy | null;
}

export type BotPreferencesUpdate = Partial<BotPreferences> & UniversalTypes.BotGetInput;

export interface BotArrangeParams {
  botIds: string[];
  isPinned: boolean;
  sectionId?: string | null;
}

export interface BotMarkReadParams extends UniversalTypes.BotGetInput {
  throughEntryId: number;
}

export interface BotPreferenceRow {
  isPinned: number | null;
  isHidden: number | null;
  rank: number | null;
  sectionId: string | null;
  isMuted: number | null;
  mutedUntil: number | null;
  readThroughEntryId: number | null;
  whenBusy: UniversalTypes.ConversationWhenBusy | null;
}
