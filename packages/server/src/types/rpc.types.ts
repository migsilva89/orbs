import type { AuthService } from '../services/auth/auth.service';
import type { BotService } from '../services/bot/bot.service';
import type { ConversationService } from '../services/conversation/conversation.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { SkillService } from '../services/skill/skill.service';
import type { ToolService } from '../services/tool/tool.service';
import type { RequestHeadersPluginContext } from '@orpc/server/plugins';

export interface RpcContext extends RequestHeadersPluginContext {
  auth: AuthService;
  tools: ToolService;
  skills: SkillService;
  mcp: McpService;
  bots: BotService;
  conversation: ConversationService;
}
