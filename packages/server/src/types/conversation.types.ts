import type { AuthService } from '../services/auth/auth.service';
import type { BotService } from '../services/bot/bot.service';
import type { AuthAuthenticateParams } from './auth.types';
import type { RuntimeService } from '@openbots/runtime/server';

export interface ConversationServiceDeps {
  auth: AuthService;
  bots: BotService;
  runtime: RuntimeService;
}

export interface ConversationWatchParams extends AuthAuthenticateParams {
  deviceId: string;
  botId: string;
  signal?: AbortSignal;
}

export interface ConversationApproveParams {
  botId: string;
  id: number;
  approved: boolean;
  answeredBy: string;
}
