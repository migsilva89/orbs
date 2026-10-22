import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactCreateInput } from '@repo/contracts/universal';

export async function artifactActionCreate({ bots, runtime }: ArtifactServiceDeps, params: ArtifactCreateInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.createArtifact(params);
}
