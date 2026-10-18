import { homedir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { match } from 'ts-pattern';
import { PLUGIN } from './plugin.constants';

export function pluginResolve(root: string, path: string) {
  return resolve(root, match(path)
    .with('~', () => homedir())
    .when((value) => value.startsWith('~/'), (value) => join(homedir(), value.slice(2)))
    .otherwise((value) => value));
}

export function pluginName(path: string) {
  const file = basename(path);

  return match(PLUGIN.indexes.includes(file))
    .with(true, () => basename(dirname(path)))
    .with(false, () => basename(file, extname(file)))
    .exhaustive();
}

export function pluginIsModule(name: string) {
  return match(name.startsWith('.') || name.endsWith('.d.ts'))
    .with(true, () => false)
    .with(false, () => ['.ts', '.js', '.mjs'].includes(extname(name)))
    .exhaustive();
}
