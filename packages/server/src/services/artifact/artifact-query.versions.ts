import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactVersionsInput } from '@openbots/contracts/universal';

export async function artifactQueryVersions({ bots, runtime }: ArtifactServiceDeps, params: ArtifactVersionsInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.artifactVersions(params);
}
