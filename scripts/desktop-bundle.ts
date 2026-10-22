import { cpSync, rmSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dir, '..');
const target = path.join(root, 'apps/desktop/dist/server');

rmSync(target, { recursive: true, force: true });

const web = Bun.spawnSync(['bun', 'run', 'build'], {
  cwd: path.join(root, 'apps/web'),
  stdout: 'inherit',
  stderr: 'inherit',
});

if (!web.success) {
  process.exit(1);
}

const builds = await Promise.all([
  Bun.build({
    entrypoints: [path.join(root, 'apps/web/src/application/server.bun.ts')],
    target: 'bun',
    outdir: path.join(target, 'web/src/application'),
  }),
  Bun.build({
    entrypoints: [path.join(root, 'apps/web/dist/server/server.tanstack.js')],
    target: 'bun',
    splitting: true,
    outdir: path.join(target, 'web/dist/server'),
  }),
  Bun.build({
    entrypoints: [path.join(root, 'apps/daemon/src/entry.native.ts')],
    target: 'bun',
    outdir: path.join(target, 'daemon'),
  }),
]);

const failed = builds.find((result) => !result.success);

if (failed) {
  console.error(failed.logs.join('\n'));
  process.exit(1);
}

cpSync(path.join(root, 'apps/web/dist/client'), path.join(target, 'web/dist/client'), { recursive: true });
cpSync(path.join(root, 'packages/server/src/services/database/migrations'), path.join(target, 'daemon/migrations'), { recursive: true });
