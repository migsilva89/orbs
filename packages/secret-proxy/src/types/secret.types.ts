export interface SecretRule {
  name: string;
  hosts: string[];
}

export type SecretMode = 'proxy' | 'varlock' | 'env';

export interface SecretSource {
  queries: {
    rules: () => Promise<SecretRule[]>;
    value: (params: SecretValueParams) => Promise<string | null>;
    settings: () => Promise<{ mode: SecretMode }>;
  };
}

export interface SecretValueParams {
  name: string;
}
