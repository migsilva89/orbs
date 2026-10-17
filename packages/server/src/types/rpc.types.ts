import type { AuthService } from '../services/auth/auth.service';
import type { ConversationService } from '../services/conversation/conversation.service';
import type { RequestHeadersPluginContext } from '@orpc/server/plugins';

export interface RpcContext extends RequestHeadersPluginContext {
  auth: AuthService;
  conversation: ConversationService;
}
