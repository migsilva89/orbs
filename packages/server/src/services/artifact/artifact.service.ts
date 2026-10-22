import { artifactActionCreate } from './artifact-action.create';
import { artifactActionRestore } from './artifact-action.restore';
import { artifactActionSaveState } from './artifact-action.save-state';
import { artifactActionUpdate } from './artifact-action.update';
import { artifactQueryGet } from './artifact-query.get';
import { artifactQueryList } from './artifact-query.list';
import { artifactQueryListBot } from './artifact-query.list-bot';
import { artifactQueryVersions } from './artifact-query.versions';
import type { ArtifactServiceDeps } from '../../types/artifact.types';
import type * as UniversalTypes from '@repo/contracts/universal';

export function makeArtifactService(deps: ArtifactServiceDeps) {
  return {
    actions: {
      create: (params: UniversalTypes.ArtifactCreateInput) => artifactActionCreate(deps, params),
      update: (params: UniversalTypes.ArtifactUpdateInput) => artifactActionUpdate(deps, params),
      saveState: (params: UniversalTypes.ArtifactSaveStateInput) => artifactActionSaveState(deps, params),
      restore: (params: UniversalTypes.ArtifactRestoreInput) => artifactActionRestore(deps, params),
    },
    queries: {
      list: (params: UniversalTypes.ArtifactListInput) => artifactQueryList(deps, params),
      listBot: (params: UniversalTypes.ArtifactBotListInput) => artifactQueryListBot(deps, params),
      get: (params: UniversalTypes.ArtifactGetInput) => artifactQueryGet(deps, params),
      versions: (params: UniversalTypes.ArtifactVersionsInput) => artifactQueryVersions(deps, params),
      blocks: () => deps.runtime.queries.artifactBlocks(),
    },
  };
}

export type ArtifactService = ReturnType<typeof makeArtifactService>;
