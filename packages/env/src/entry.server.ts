import { envServerSchema } from '@repo/env/types';
import { createEnv } from '@t3-oss/env-core';

export const env = createEnv({
  server: envServerSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
