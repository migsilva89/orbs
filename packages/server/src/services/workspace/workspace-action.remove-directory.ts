import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import type { WorkspaceServiceDeps } from '../../types/workspace.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function workspaceActionRemoveDirectory({ root }: WorkspaceServiceDeps, { botId }: BotGetInput) {
  await rm(join(root, 'agents', botId), { recursive: true, force: true });
}
