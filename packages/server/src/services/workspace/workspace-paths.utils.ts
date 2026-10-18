import { constants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { match } from 'ts-pattern';

export async function workspacePathsNative(dataDir: string) {
  const root = resolve(match(dataDir)
    .with('~', () => homedir())
    .when((path) => path.startsWith('~/'), (path) => join(homedir(), path.slice(2)))
    .otherwise((path) => path));

  const paths = {
    agents: join(root, 'agents'),
    data: join(root, 'data'),
    runtime: join(root, 'data', 'runtime.sql'),
    database: join(root, 'data', 'app.sqlite'),
  };

  await Promise.all([root, paths.data, paths.agents].map(workspacePathsNativeDirectory));

  return {
    ...paths,
    root,
  };

  async function workspacePathsNativeDirectory(directory: string): Promise<void> {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await access(directory, constants.R_OK | constants.W_OK | constants.X_OK);
  }
}
