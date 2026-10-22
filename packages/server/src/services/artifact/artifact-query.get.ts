import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactGetInput } from '@repo/contracts/universal';

export async function artifactQueryGet({ bots, runtime }: ArtifactServiceDeps, params: ArtifactGetInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.artifact(params);
}
