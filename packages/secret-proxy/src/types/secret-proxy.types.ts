import type { SecretSource, SecretValueParams } from './secret.types';
import type { CompletedRequest, Mockttp, requestSteps } from 'mockttp';

export interface SecretProxyServiceParams {
  source: SecretSource;
  /** Folder for the public CA bundle; never holds a secret value. */
  folder: string;
}

export interface SecretProxyServiceDeps extends SecretProxyServiceParams {
  state: SecretProxyState;
}

export interface SecretProxyState {
  server: Mockttp | null;
  starting: Promise<void> | null;
  /** Real values swapped into each in-flight request, so its response can be scrubbed. */
  swapped: Map<string, SecretSwap[]>;
}

export type SecretPlaceholderParams = SecretValueParams;

export interface SecretSwap {
  placeholder: string;
  value: string;
}

export interface SecretProxySwapParams {
  request: CompletedRequest;
}

export interface SecretProxyScrubParams {
  response: requestSteps.PassThroughResponse;
  request: CompletedRequest;
}
