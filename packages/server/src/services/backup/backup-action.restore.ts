import { backupRestore } from '../../types/backup.types';
import { backupAssertSource, backupCanonicalAbsent, backupCanonicalRoot, backupOutside, backupPopulateRestore, backupPublish, backupRemoveStaging, backupStage } from './backup.utils';
import type { BackupRestoreInput, BackupServiceDeps } from '../../types/backup.types';

export async function backupActionRestore(deps: BackupServiceDeps, params: BackupRestoreInput) {
  const { bundle: bundleInput } = backupRestore.parse(params);
  const bundle = await backupCanonicalRoot(bundleInput);
  const root = await backupCanonicalAbsent(deps.root);
  backupOutside(bundle, root);
  await backupAssertSource(bundle);

  const staging = await backupStage(root);

  try {
    await backupPopulateRestore(bundle, staging);
    await backupPublish(staging, root);
  } catch (error) {
    await backupRemoveStaging(staging);
    throw error;
  }
}
