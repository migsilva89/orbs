import { artifactActionUpdate } from './artifact-action.update';
import type { ArtifactSaveStateParams, ArtifactServiceDeps } from '../../types/artifact.types';
import type { Context } from '@earendil-works/chord/context';
import type { Artifact } from '@openbots/contracts/universal';

export function artifactActionSaveState(
  deps: ArtifactServiceDeps,
  params: ArtifactSaveStateParams,
  context: Context,
): Promise<Artifact> {
  return artifactActionUpdate(deps, params, context);
}
