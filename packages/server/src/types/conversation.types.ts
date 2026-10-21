import type { AttachmentService } from '../services/attachment/attachment.service';
import type { AuthService } from '../services/auth/auth.service';
import type { BotService } from '../services/bot/bot.service';
import type { NotificationService } from '../services/notification/notification.service';
import type { SettingsService } from '../services/settings/settings.service';
import type { SkillService } from '../services/skill/skill.service';
import type { ToolService } from '../services/tool/tool.service';
import type { AuthAuthenticateParams } from './auth.types';
import type { BotPreferences } from './bot.types';
import type { ReplicatedState } from '@earendil-works/chord';
import type { ConversationAnswerQuestionInput } from '@openbots/contracts/universal';
import type { RuntimeService } from '@openbots/runtime/server';

export interface ConversationServiceDeps {
  auth: AuthService;
  notifications: NotificationService;
  attachments: AttachmentService;
  bots: BotService;
  runtime: RuntimeService;
  settings: SettingsService;
  skill: SkillService;
  tools: ToolService;
}

export interface ConversationPreferencesParams {
  botId: string;
  preference: BotPreferences;
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
  always?: boolean;
  answeredBy: string;
}

export interface ConversationAnswerQuestionParams extends ConversationAnswerQuestionInput {
  answeredBy: string;
}
