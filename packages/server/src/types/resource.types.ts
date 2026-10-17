import type { DatabaseService } from '../services/database/database.service';
import type { McpService } from './mcp.types';
import type { SkillService } from './skill.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export interface ResourceServiceDeps {
  database: DatabaseService;
  skill: SkillService;
  mcp: McpService;
}

export interface ResourceBotParams {
  bot: Pick<UniversalTypes.Bot, 'id' | 'inherit'>;
}
