import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactUpdateInput } from '@repo/contracts/universal';

export async function artifactActionUpdate({ bots, runtime }: ArtifactServiceDeps, params: ArtifactUpdateInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.updateArtifact(params);
}
