import type { AuthService } from '../services/auth/auth.service';
import type { BotService } from '../services/bot/bot.service';
import type { SkillService } from '../services/skill/skill.service';
import type { AuthAuthenticateParams } from './auth.types';
import type { ReplicatedState } from '@earendil-works/chord';
import type { RuntimeService } from '@openbots/runtime/server';

export interface ConversationServiceDeps {
  auth: AuthService;
  bots: BotService;
  runtime: RuntimeService;
  skill: SkillService;
}

export interface ConversationListWatchParams extends AuthAuthenticateParams {
  deviceId: string;
  signal?: AbortSignal;
}

export interface ConversationWatchParams extends ConversationListWatchParams {
  botId: string;
  conversationId?: number;
}

export type ConversationRuntimeWatch = Awaited<ReturnType<RuntimeService['watch']>>;

export interface ConversationSubscription<T extends object> {
  state: ReplicatedState<T>;
  closed: ConversationRuntimeWatch['closed'];
  stop: ConversationRuntimeWatch['stop'];
}

export type ConversationWatchTransform<T> = (value: T) => object | Promise<object>;

export interface ConversationApproveParams {
  botId: string;
  id: number;
  approved: boolean;
  answeredBy: string;
}
