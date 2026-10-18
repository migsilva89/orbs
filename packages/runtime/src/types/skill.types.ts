import type * as UniversalTypes from '@openbots/contracts/universal';

export interface SkillLoaderServiceDeps {
  root: string;
}

export interface SkillLoadParams {
  botId: string;
  directories: string[];
  isInherited: boolean;
}

export interface SkillLoadResult {
  prompt: string;
  skills: UniversalTypes.Skill[];
}
