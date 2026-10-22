import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactListInput } from '@repo/contracts/universal';

export async function artifactQueryList({ bots, runtime }: ArtifactServiceDeps, params: ArtifactListInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.artifacts(params);
}
