import { z } from 'zod';

export const secretName = z.string().trim().regex(/^[A-Z][A-Z0-9_]{0,63}$/);

export const secretHost = z.string().trim().toLowerCase().max(253).regex(/^(?:\*\.)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/);

export const secretRule = z.object({
  name: secretName,
  hosts: z.array(secretHost).min(1).max(10),
});

export const secretRules = z.array(secretRule).max(100);

export const secretSave = secretRule.extend({ value: z.string().min(1).max(16384) });
export const secretRemove = secretRule.pick({ name: true });

export const secretMode = z.enum(['proxy', 'varlock', 'env']);
export const secretSettings = z.object({ mode: secretMode });
export const secretConfigure = secretSettings.partial();
export const secretVoid = z.void();

export type SecretRule = z.infer<typeof secretRule>;
export type SecretSaveInput = z.infer<typeof secretSave>;
export type SecretRemoveInput = z.infer<typeof secretRemove>;
export type SecretMode = z.infer<typeof secretMode>;
export type SecretSettings = z.infer<typeof secretSettings>;
export type SecretConfigureInput = z.infer<typeof secretConfigure>;
