import type { AuthService } from '../services/auth/auth.service';
import type { BotService } from '../services/bot/bot.service';
import type { ConversationService } from '../services/conversation/conversation.service';
import type { ResourceService } from '../services/resource/resource.service';
import type { ToolService } from '../services/tool/tool.service';
import type { RequestHeadersPluginContext } from '@orpc/server/plugins';

export interface RpcContext extends RequestHeadersPluginContext {
  auth: AuthService;
  tools: ToolService;
  resources: ResourceService;
  bots: BotService;
  conversation: ConversationService;
}
