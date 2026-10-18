import { formatSkillsForPrompt } from '@earendil-works/pi-coding-agent';
import { conversationContent } from '@openbots/contracts/universal';
import { log } from '@openbots/logger/server';
import { z } from 'zod';
import { skillQueryResolve } from './skill-query.resolve';
import type { SkillLoaderServiceDeps, SkillLoadParams, SkillLoadResult } from '../../types/skill.types';

const argumentsSchema = z.record(z.string(), z.json()).parse(z.toJSONSchema(conversationContent));

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
      argumentsSchema,
      argumentHint: skill.argumentHint,
    })),
  };
}
