import { readdir, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { match } from 'ts-pattern';

export async function coreMcpFilesNative(path: string, visited = new Set<string>()): Promise<string[]> {
  const canonical = await realpath(path);

  return match(visited.has(canonical))
    .with(true, () => [])
    .with(false, async () => {
      const ancestors = new Set([...visited, canonical]);
      const entry = await stat(canonical);

      return match(entry.isDirectory())
        .with(false, () => [canonical])
        .with(true, async () => {
          const entries = await readdir(canonical, { withFileTypes: true });

          const results = await Promise.all(entries
            .filter((child) => !['node_modules', '.git'].includes(child.name))
            .map(async (child) => {
              const childPath = join(canonical, child.name);

              const isDirectory = child.isDirectory()
              || (child.isSymbolicLink() && (await stat(childPath)).isDirectory());

              const shouldScan = isDirectory || child.name === 'mcp.json' || child.name.endsWith('.mcp.json');

              return match(shouldScan)
                .with(true, () => coreMcpFilesNative(childPath, ancestors))
                .with(false, () => [])
                .exhaustive();
            }));

          return [...new Set(results.flat())].sort();
        })
        .exhaustive();
    })
    .exhaustive();
}
