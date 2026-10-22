import type * as UniversalTypes from '@repo/contracts/universal';

export interface InstructionLoaderServiceDeps {
  root: string;
}

export interface InstructionLoadParams {
  botId: string;
  paths: string[];
  isInherited: boolean;
}

export type InstructionLoadResult = UniversalTypes.InstructionCatalog;
