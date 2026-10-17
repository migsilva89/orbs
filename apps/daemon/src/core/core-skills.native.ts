import { formatSkillsForPrompt, getAgentDir, loadSkills } from '@earendil-works/pi-coding-agent';
import { log } from '@openbots/logger/server';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { match } from 'ts-pattern';
import type { ResourceSkills, ResourceSkillsParams } from '@openbots/server/server';

export function coreSkillsNative(root: string) {
  return ({ botId, skillDirs, isInherited }: ResourceSkillsParams): ResourceSkills => {
    const directory = join(root, 'agents', botId);
    const agentDir = getAgentDir();
    const localPaths = [join(directory, '.pi/skills'), join(directory, '.agents/skills')];

    const sharedPaths = match(isInherited)
      .with(true, () => [...skillDirs, ...[join(agentDir, 'skills')].filter(existsSync)])
      .with(false, () => [])
      .exhaustive();

    const { skills, diagnostics } = loadSkills({
      cwd: root,
      agentDir,
      includeDefaults: false,
      skillPaths: [...localPaths.filter(existsSync), ...sharedPaths],
    });

    for (const diagnostic of diagnostics) {
      log.warn({
        tag: 'skills',
        botId,
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
      })),
    };
  };
}
