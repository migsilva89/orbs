import { z } from 'zod';
import { BACKUP } from '../services/backup/backup.constants';

export interface BackupServiceDeps {
  root: string;
}

export const backupCreate = z.object({
  destination: z.string().trim().min(1),
});

export const backupRestore = z.object({
  bundle: z.string().trim().min(1),
});

export const backupManifestFile = z.object({
  path: z.string().min(1),
  size: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
});

export const backupManifest = z.object({
  version: z.literal(BACKUP.version),
  createdAt: z.number().int(),
  files: z.array(backupManifestFile).min(1),
  directories: z.array(z.string()),
  excluded: z.object({
    locks: z.literal(true),
    ipc: z.literal(true),
    providerAuth: z.string().min(1),
    sharedSources: z.string().min(1),
  }),
});

export type BackupCreateInput = z.infer<typeof backupCreate>;
export type BackupRestoreInput = z.infer<typeof backupRestore>;
export type BackupManifest = z.infer<typeof backupManifest>;
export type BackupManifestFile = z.infer<typeof backupManifestFile>;
