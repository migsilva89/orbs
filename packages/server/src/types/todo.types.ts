import type { BotService } from '../services/bot/bot.service';
import type { RuntimeService } from '@repo/runtime/server';

export interface TodoServiceDeps {
  bots: BotService;
  runtime: RuntimeService;
}
