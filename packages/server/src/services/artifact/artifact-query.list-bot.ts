import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactBotListInput } from '@repo/contracts/universal';

export async function artifactQueryListBot({ bots, runtime }: ArtifactServiceDeps, params: ArtifactBotListInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.botArtifacts(params);
}
