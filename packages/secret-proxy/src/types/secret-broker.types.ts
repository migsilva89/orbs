import type { SecretProxyService } from '../services/secret-proxy/secret-proxy.service';
import type { SecretRule, SecretSource } from './secret.types';

export interface SecretBrokerServiceDeps {
  source: SecretSource;
  proxy: SecretProxyService;
  folder: string;
  varlock: string | null;
}

export interface SecretBrokerExecution {
  command: string;
  env: Record<string, string>;
}

export interface SecretBrokerPrepareParams {
  execution: SecretBrokerExecution;
}

export interface SecretBrokerVarlockParams extends SecretBrokerPrepareParams {
  rules: SecretRule[];
  varlock: string;
}

export interface SecretBrokerRedactParams {
  text: string;
}
