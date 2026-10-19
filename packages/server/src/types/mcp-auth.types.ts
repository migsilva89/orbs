import type { AuthService } from '../services/auth/auth.service';
import type { BotService } from '../services/bot/bot.service';
import type { McpService } from '../services/mcp/mcp.service';
import type { McpAuthCompleteInput, McpAuthStartInput, McpAuthTarget } from '@openbots/contracts/universal';
import type { McpAuthService } from '@openbots/runtime/server';

export interface McpAuthServiceDeps {
  bots: BotService;
  mcp: McpService;
  oauth: McpAuthService;
  auth: AuthService;
}

export interface McpAuthTargetParams extends McpAuthTarget {
  deviceId: string;
}

export interface McpAuthStartParams extends McpAuthStartInput {
  deviceId: string;
  authorization: string | null | undefined;
}

export interface McpAuthCompleteParams extends McpAuthCompleteInput {
  deviceId: string;
}
