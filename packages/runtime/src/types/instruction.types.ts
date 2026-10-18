import type * as UniversalTypes from '@openbots/contracts/universal';

export interface InstructionLoaderServiceDeps {
  root: string;
}

export interface InstructionLoadParams {
  botId: string;
  paths: string[];
  isInherited: boolean;
}

export type InstructionLoadResult = UniversalTypes.InstructionCatalog;
