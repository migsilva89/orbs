import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactBotListInput } from '@openbots/contracts/universal';

export async function artifactQueryListBot({ bots, runtime }: ArtifactServiceDeps, params: ArtifactBotListInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.botArtifacts(params);
}
