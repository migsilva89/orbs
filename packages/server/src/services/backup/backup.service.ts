import { backupActionCreate } from './backup-action.create';
import { backupActionRestore } from './backup-action.restore';
import type { BackupCreateInput, BackupRestoreInput, BackupServiceDeps } from '../../types/backup.types';

export function makeBackupService(deps: BackupServiceDeps) {
  return {
    actions: {
      create: (params: BackupCreateInput) => backupActionCreate(deps, params),
      restore: (params: BackupRestoreInput) => backupActionRestore(deps, params),
    },
  };
}
