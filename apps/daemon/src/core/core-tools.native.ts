import { NodeExecutionEnv } from '@earendil-works/pi-durable/env/node';
import { resolve } from 'node:path';

export function coreToolsNative(root: string) {
  return ({ cwd = '.' }: { cwd?: string }) => new NodeExecutionEnv({ cwd: resolve(root, cwd) });
}
