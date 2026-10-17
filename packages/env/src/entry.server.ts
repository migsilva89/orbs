import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const serverEnvSchema = {
  OPENBOTS_DATA_DIR: z.string().trim().min(1).default('~/.config/openbots/'),
  OPENBOTS_HOST: z.string().trim().min(1).default('0.0.0.0'),
  OPENBOTS_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  OPENBOTS_LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
};

export const env = createEnv({
  server: serverEnvSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
