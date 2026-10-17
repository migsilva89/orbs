import type { BotGetInput } from '@openbots/contracts/universal';

export interface WorkspaceService {
  actions: {
    prepareDirectory(params: BotGetInput): Promise<void>;
  };
}
