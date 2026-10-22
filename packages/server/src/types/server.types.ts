import type { SettingsService } from '../services/settings/settings.service';
import type { ServerInfo } from '@repo/contracts/universal';

export interface ServerServiceDeps {
  settings: SettingsService;
}

export interface ServerQueryDeps {
  info: ServerInfo;
}

export interface ServerConnectionParams {
  protocolVersion: string | null;
  serverId: string | null;
}
