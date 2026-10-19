import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { match } from 'ts-pattern';

export function workspacePathsRootNative(dataDir: string) {
  return resolve(match(dataDir)
    .with('~', () => homedir())
    .when((path) => path.startsWith('~/'), (path) => join(homedir(), path.slice(2)))
    .otherwise((path) => path));
}

export async function workspacePathsNative(dataDir: string) {
  const root = workspacePathsRootNative(dataDir);

  const paths = {
    agents: join(root, 'agents'),
    data: join(root, 'data'),
    bots: join(root, 'data', 'bots'),
    lock: join(root, 'data', 'daemon'),
    database: join(root, 'data', 'app.sqlite'),
  };

  await Promise.all([root, paths.data, paths.bots, paths.agents].map(workspacePathsNativeDirectory));

  return {
    ...paths,
    root,
  };

  async function workspacePathsNativeDirectory(directory: string): Promise<void> {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await access(directory, constants.R_OK | constants.W_OK | constants.X_OK);
  }
}
