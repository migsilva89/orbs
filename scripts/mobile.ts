import { createFingerprintAsync } from '@expo/fingerprint';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const mobile = path.resolve(import.meta.dir, '../apps/mobile');
const stamp = path.join(mobile, 'ios/.fingerprint');

function expo(args: string[]) {
  const result = Bun.spawnSync(['bunx', 'expo', ...args], {
    cwd: mobile,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  });

  if (!result.success) {
    process.exit(1);
  }
}

const { hash } = await createFingerprintAsync(mobile);
const built = existsSync(stamp) ? readFileSync(stamp, 'utf8').trim() : null;

if (hash !== built) {
  console.log('Native code changed. Rebuilding the iOS dev app...');
  expo(['prebuild', '--platform', 'ios', '--no-install']);
  expo(['run:ios', '--no-bundler']);
  writeFileSync(stamp, hash);
}

expo(['start', '--dev-client', '--ios']);
