import type { SecretProxyService } from '../services/secret-proxy/secret-proxy.service';
import type { SecretRule, SecretSource } from './secret.types';

export interface SecretBrokerServiceDeps {
  source: SecretSource;
  proxy: SecretProxyService;
  /** Folder for the Varlock schema; never holds a secret value. */
  folder: string;
  /** The Varlock CLI, when installed; without it the Varlock mode uses the built-in proxy. */
  varlock: string | null;
}

/** A bash command about to run, which the broker may change. */
export interface SecretExecution {
  command: string;
  env: Record<string, string>;
}

export interface SecretPrepareParams {
  execution: SecretExecution;
}

export interface SecretVarlockParams extends SecretPrepareParams {
  rules: SecretRule[];
  varlock: string;
}

export interface SecretRedactParams {
  text: string;
}
