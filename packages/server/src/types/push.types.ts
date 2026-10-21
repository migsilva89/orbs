import type { BotService } from '../services/bot/bot.service';
import type { DatabaseService } from '../services/database/database.service';
import type { NotificationItem } from '@openbots/contracts/universal';
import type { RuntimeService } from '@openbots/runtime/server';

export interface PushServiceDeps {
  database: DatabaseService;
  runtime: RuntimeService;
  bots: BotService;
}

export interface PushRegisterParams {
  deviceId: string;
  token: string | null;
}

export interface PushSendParams {
  items: NotificationItem[];
}
