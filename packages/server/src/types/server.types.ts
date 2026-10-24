import { z } from 'zod';
import type { ServerNetworkService } from '../services/server/server-network.service';
import type { SettingsService } from '../services/settings/settings.service';

export interface ServerIdentity {
  id: string;
  protocolVersion: number;
}

export interface ServerServiceDeps {
  settings: SettingsService;
  network: ServerNetworkService;
}

export interface ServerServiceState extends ServerServiceDeps {
  identity: Promise<ServerIdentity>;
}

export interface ServerQueryDeps {
  identity: ServerIdentity;
}

export interface ServerConnectionParams {
  protocolVersion: string | null;
  serverId: string | null;
}

export interface ServerNetworkDeps {
  host: string;
  port: number;
}

export const serverTailscaleStatus = z.object({
  BackendState: z.string(),
  Self: z.object({ DNSName: z.string() }),
});
