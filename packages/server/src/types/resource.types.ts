import type { DatabaseService } from '../services/database/database.service';
import type * as UniversalTypes from '@openbots/contracts/universal';

export interface ResourceServiceDeps {
  database: DatabaseService;
  driver: ResourceDriver;
}

export interface ResourceDriver {
  prepareDirectory(params: UniversalTypes.BotGetInput): Promise<void>;
  loadSkills(params: ResourceSkillsParams): ResourceSkills;
  discoverMcp(params: ResourceMcpParams): Promise<UniversalTypes.ResourceMcpCatalog>;
}

export interface ResourceBotParams {
  bot: Pick<UniversalTypes.Bot, 'id' | 'inherit'>;
}

export interface ResourceBotSkillsParams extends ResourceBotParams {
  settings: UniversalTypes.ResourceSettings;
}

export interface ResourceSkillsParams extends Pick<UniversalTypes.ResourceSettings, 'skillDirs'> {
  botId: string;
  isInherited: boolean;
}

export interface ResourceMcpParams extends Pick<UniversalTypes.ResourceSettings, 'mcpPaths'> {
  botId: string;
  isInherited: boolean;
}

export interface ResourceSkills {
  prompt: string;
  skills: UniversalTypes.ResourceSkill[];
}
