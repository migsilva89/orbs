import { z } from 'zod';

export const credentialsKey = z.string().trim().min(1).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/);

export const credentialsSet = z.object({
  key: credentialsKey,
  value: z.string().min(1).max(16384).nullable(),
});

export const credentialsMetadata = z.object({
  key: z.string(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const credentialsList = z.array(credentialsMetadata);
export const credentialsSetResult = z.void();

export type CredentialsSetInput = z.infer<typeof credentialsSet>;
