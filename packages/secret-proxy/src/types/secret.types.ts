/** A stored secret and the hosts it may be sent to. A host is exact or a `*.example.com` wildcard. */
export interface SecretRule {
  name: string;
  hosts: string[];
}

/** How commands get secrets: placeholders through the built-in or Varlock proxy, or real values in the environment. */
export type SecretMode = 'proxy' | 'varlock' | 'env';

/** Where secrets come from: the host application supplies it, so this package never sees its storage. */
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
