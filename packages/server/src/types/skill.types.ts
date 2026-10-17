import type * as UniversalTypes from '@openbots/contracts/universal';

export interface SkillService {
  queries: {
    load(params: SkillLoadParams): SkillLoadResult;
  };
}

export interface SkillLoadParams extends Pick<UniversalTypes.ResourceSettings, 'skillDirs'> {
  botId: string;
  isInherited: boolean;
}

export interface SkillLoadResult {
  prompt: string;
  skills: UniversalTypes.ResourceSkill[];
}
