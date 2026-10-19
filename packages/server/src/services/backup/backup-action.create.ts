import { makeStorageLockService } from '@openbots/runtime/native';
import { join } from 'node:path';
import { backupCreate } from '../../types/backup.types';
import { BACKUP } from './backup.constants';
import { backupAssertSource, backupCanonicalAbsent, backupCanonicalRoot, backupOutside, backupPopulateCreate, backupPublish, backupRemoveStaging, backupStage } from './backup.utils';
import type { BackupCreateInput, BackupServiceDeps } from '../../types/backup.types';

export async function backupActionCreate(deps: BackupServiceDeps, params: BackupCreateInput) {
  const { destination: destinationInput } = backupCreate.parse(params);
  const root = await backupCanonicalRoot(deps.root);
  const destination = await backupCanonicalAbsent(destinationInput);
  backupOutside(root, destination);
  await backupAssertSource(root);

  const lock = await makeStorageLockService({ path: join(root, BACKUP.files.runtime) });

  try {
    const staging = await backupStage(destination);

    try {
      await backupPopulateCreate(root, staging);
      await backupPublish(staging, destination);
    } catch (error) {
      await backupRemoveStaging(staging);
      throw error;
    }
  } finally {
    lock.close();
  }
}
