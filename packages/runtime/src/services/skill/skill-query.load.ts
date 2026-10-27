import { formatSkillsForPrompt } from '@earendil-works/pi-coding-agent';
import { log } from '@repo/logger/server';
import { skillArgumentsSchema } from '../../types/skill.types';
import { skillQueryResolve } from './skill-query.resolve';
import type { SkillLoaderServiceDeps, SkillLoadParams, SkillLoadResult } from '../../types/skill.types';

export function skillQueryLoad(deps: SkillLoaderServiceDeps, params: SkillLoadParams): SkillLoadResult {
  const { skills, diagnostics } = skillQueryResolve(deps, params);

  for (const diagnostic of diagnostics) {
    log.warn({
      tag: 'skills',
      botId: params.botId,
      ...diagnostic,
    });
  }

  return {
    prompt: formatSkillsForPrompt(skills, 'read'),
    skills: skills.map((skill) => ({
      name: skill.name,
      description: skill.description,
      filePath: skill.filePath,
      isModelInvocable: !skill.disableModelInvocation,
      argumentsSchema: skillArgumentsSchema,
      argumentHint: skill.argumentHint,
      isShared: skill.isShared,
    })),
  };
}
