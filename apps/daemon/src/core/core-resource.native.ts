import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { coreMcpNative } from './core-mcp.native';
import { coreSkillsNative } from './core-skills.native';
import type { ResourceDriver } from '@openbots/server/server';

export function coreResourceNative(root: string): ResourceDriver {
  return {
    async prepareDirectory({ botId }) {
      const directory = join(root, 'agents', botId);
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await access(directory, constants.R_OK | constants.W_OK | constants.X_OK);
    },
    loadSkills: coreSkillsNative(root),
    discoverMcp: coreMcpNative(root),
  };
}
