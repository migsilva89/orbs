import { createEnv } from '@t3-oss/env-core';
import { envClientSchema } from './types/env-client.types';

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: envClientSchema,
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
});
