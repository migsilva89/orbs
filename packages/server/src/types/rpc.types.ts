import type { AuthService } from '../services/auth/auth.service';
import type { BotService } from '../services/bot/bot.service';
import type { ConversationService } from '../services/conversation/conversation.service';
import type { InstructionService } from '../services/instruction/instruction.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { PluginService } from '../services/plugin/plugin.service';
import type { SkillService } from '../services/skill/skill.service';
import type { ToolService } from '../services/tool/tool.service';
import type { RuntimeService } from '@openbots/runtime/server';
import type { RequestHeadersPluginContext } from '@orpc/server/plugins';

export interface RpcContext extends RequestHeadersPluginContext {
  auth: AuthService;
  runtime: RuntimeService;
  tools: ToolService;
  skills: SkillService;
  plugins: PluginService;
  instructions: InstructionService;
  mcp: McpService;
  bots: BotService;
  conversation: ConversationService;
}
