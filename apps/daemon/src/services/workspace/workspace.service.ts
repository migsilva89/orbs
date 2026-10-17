import { workspaceActionPrepareDirectory } from './workspace-action.prepare-directory';
import type { WorkspaceServiceDeps } from '../../types/workspace.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export function makeWorkspaceService(deps: WorkspaceServiceDeps) {
  return {
    actions: {
      prepareDirectory: (params: BotGetInput) => workspaceActionPrepareDirectory(deps, params),
    },
  };
}

export type WorkspaceService = ReturnType<typeof makeWorkspaceService>;
