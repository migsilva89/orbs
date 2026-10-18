import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactRestoreInput } from '@openbots/contracts/universal';

export async function artifactActionRestore({ bots, runtime }: ArtifactServiceDeps, params: ArtifactRestoreInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.restoreArtifact(params);
}
