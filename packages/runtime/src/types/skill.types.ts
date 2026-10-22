import type { LoadSkillsResult, Skill } from '@earendil-works/pi-coding-agent';
import type * as UniversalTypes from '@repo/contracts/universal';

export interface SkillLoaderServiceDeps {
  root: string;
  catalogs: Map<string, SkillCatalogCache>;
}

export interface SkillResolved extends Skill {
  argumentHint: string | null;
}

export interface SkillResolvedResult extends LoadSkillsResult {
  skills: SkillResolved[];
}

export interface SkillCatalogCache {
  key: string;
  expiresAt: number;
  result: SkillResolvedResult;
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

export interface SkillExpandParams extends SkillLoadParams {
  names: string[];
  content: string;
}

export interface SkillExpandResult {
  content: string;
}
