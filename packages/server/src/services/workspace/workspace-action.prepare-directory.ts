import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { WorkspaceServiceDeps } from '../../types/workspace.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function workspaceActionPrepareDirectory({ root }: WorkspaceServiceDeps, { botId }: BotGetInput) {
  const directory = join(root, 'agents', botId);
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await access(directory, constants.R_OK | constants.W_OK | constants.X_OK);
}
