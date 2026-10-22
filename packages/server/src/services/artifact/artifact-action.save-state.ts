import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type { ArtifactSaveStateInput } from '@repo/contracts/universal';

export async function artifactActionSaveState({ bots, runtime }: ArtifactServiceDeps, params: ArtifactSaveStateInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.saveArtifactState(params);
}
