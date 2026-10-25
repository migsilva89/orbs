import type { ModelRuntime } from '@earendil-works/pi-coding-agent';
import type * as UniversalTypes from '@repo/contracts/universal';

export interface ProviderServiceDeps {
  models: ModelRuntime;
  sessions: Map<string, ProviderLoginRecord>;
}

export interface ProviderLoginParams extends UniversalTypes.ProviderLoginInput {
  deviceId: string;
  serverId: string;
}

export interface ProviderCompleteParams extends UniversalTypes.ProviderCompleteInput {
  deviceId: string;
}

export interface ProviderSessionParams extends UniversalTypes.ProviderSessionIdInput {
  deviceId: string;
}

export type ProviderCancelParams = ProviderSessionParams;
export type ProviderListParams = Pick<ProviderLoginParams, 'deviceId'>;
export type ProviderLogoutParams = UniversalTypes.ProviderLogoutInput;
export type ProviderCancelDeviceParams = Pick<ProviderLoginParams, 'deviceId'>;

export interface ProviderPromptWaiter {
  promptId: string;
  resolve: (answer: string) => void;
  reject: (error: Error) => void;
}

export interface ProviderLoginRecord {
  id: string;
  providerId: string;
  authType: UniversalTypes.ProviderAuthType;
  deviceId: string;
  status: UniversalTypes.ProviderSession['status'];
  expiresAt: number;
  abort: AbortController;
  timeout?: ReturnType<typeof setTimeout>;
  prompt?: UniversalTypes.ProviderPrompt;
  events: UniversalTypes.ProviderEvent[];
  pending?: ProviderPromptWaiter;
  done: Promise<void>;
  error?: string;
}

export type ProviderSettle = () => void;

export interface ProviderService {
  models: ModelRuntime;
  actions: {
    login(params: ProviderLoginParams): UniversalTypes.ProviderSession;
    complete(params: ProviderCompleteParams): UniversalTypes.ProviderSession;
    cancel(params: ProviderCancelParams): void;
    logout(params: ProviderLogoutParams): Promise<void>;
    cancelDevice(params: ProviderCancelDeviceParams): void;
  };
  queries: {
    list(params: ProviderListParams): UniversalTypes.ProviderList;
    session(params: ProviderSessionParams): UniversalTypes.ProviderSession;
  };
  close(): Promise<void>;
}
