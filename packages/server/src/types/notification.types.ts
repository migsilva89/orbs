import type { BotService } from '../services/bot/bot.service';
import type { DatabaseService } from '../services/database/database.service';
import type { SettingsService } from '../services/settings/settings.service';
import type * as UniversalTypes from '@openbots/contracts/universal';
import type { RuntimeService } from '@openbots/runtime/server';

export interface NotificationServiceParams {
  database: DatabaseService;
  runtime: RuntimeService;
  bots: BotService;
  settings: SettingsService;
}

export interface NotificationPresence extends UniversalTypes.NotificationPresenceInput {
  deviceId: string;
  seenAt: number;
}

export interface NotificationServiceDeps extends NotificationServiceParams {
  presences: Map<string, NotificationPresence>;
  targets: Map<string, Promise<string | null>>;
}

export interface NotificationPushParams extends UniversalTypes.NotificationPushInput {
  deviceId: string;
}

export interface NotificationPresenceParams extends UniversalTypes.NotificationPresenceInput {
  deviceId: string;
}

export interface NotificationTargetParams {
  item: UniversalTypes.NotificationItem;
}

export interface NotificationSendParams {
  token: string;
  url: string | null;
  items: UniversalTypes.NotificationItem[];
}
