import { z } from 'zod';
import type { AuthProvider } from '@earendil-works/pi-mcp';
import type { McpOAuthProvider } from '@earendil-works/pi-mcp/oauth';
import type { McpAuthCompleteResult, McpAuthStartResult, McpAuthStatusResult } from '@repo/contracts/universal';

export type { McpAuthCompleteResult, McpAuthStartResult, McpAuthStatusResult };

export const mcpAuthStored = z.object({
  serverUrl: z.string().min(1),
  redirectUrl: z.string().min(1).optional(),
  tokens: z.object({
    access_token: z.string().min(1),
    token_type: z.string().min(1),
  }).passthrough().optional(),
}).passthrough();

export type McpAuthRecord = z.infer<typeof mcpAuthStored>;

export interface McpAuthCredentials {
  actions: {
    set: (params: { key: string; value: string | null }) => Promise<void>;
  };
  queries: {
    get: (params: { key: string }) => Promise<string | null>;
  };
}

export interface McpAuthServiceDeps {
  credentials: McpAuthCredentials;
  appName: string;
}

export interface McpAuthPending {
  deviceId: string;
  botId: string;
  returnUrl?: string;
  serverUrl: string;
  redirectUrl: string;
  state?: string;
  isCompleting?: boolean;
  controller: AbortController;
  createdAt: number;
}

export interface McpAuthCachedProvider {
  redirectUrl: string;
  epoch: number;
  saveEpoch: number;
  oauth: McpOAuthProvider;
  authProvider: AuthProvider;
  onRedirect: { current: (url: URL) => undefined };
}

export interface McpAuthServiceState extends McpAuthServiceDeps {
  pending: Map<string, McpAuthPending>;
  providers: Map<string, McpAuthCachedProvider>;
  epochs: Map<string, number>;
  saveEpochs: Map<string, number>;
  writes: Map<string, Promise<void>>;
}

export interface McpAuthServerParams {
  serverUrl: string;
}

export interface McpAuthDeviceParams extends McpAuthServerParams {
  deviceId: string;
}

export interface McpAuthStartParams extends McpAuthDeviceParams {
  botId: string;
  redirectUrl: string;
  returnUrl?: string;
}

export interface McpAuthCallbackParams {
  search: string;
}

export interface McpAuthCallbackResult {
  botId: string;
  returnUrl?: string;
  status: 'connected' | 'failed';
}

export interface McpAuthCompleteParams extends McpAuthDeviceParams {
  callbackUrl: string;
}

export interface McpAuthCancelDeviceParams {
  deviceId: string;
}

export interface McpAuthStoreBind {
  redirectUrl?: string;
  epoch: number;
  saveEpoch: number;
}

export interface McpAuthCallback {
  code: string;
  iss?: string;
}
