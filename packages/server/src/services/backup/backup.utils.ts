import { Errors } from '@openbots/errors/universal';
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { chmod, lstat, mkdir, open, readdir, readFile, realpath, rename, rm, rmdir, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pipeline } from 'node:stream/promises';
import { match } from 'ts-pattern';
import { backupManifest } from '../../types/backup.types';
import { BACKUP } from './backup.constants';
import type { BackupManifest, BackupManifestFile } from '../../types/backup.types';

const FILE_MODE = 0o600;
const EXEC_MODE = 0o700;
const DIRECTORY_MODE = 0o700;

export async function backupCanonicalRoot(path: string) {
  try {
    return await realpath(resolve(path));
  } catch (error) {
    throw match(error)
      .with({ code: 'ENOENT' }, () => new Errors.NOT_FOUND({ resource: 'backup', cause: error }))
      .otherwise(() => error);
  }
}

export async function backupCanonicalAbsent(path: string) {
  const resolved = resolve(path);
  await backupAssertAbsent(resolved);

  try {
    return join(await realpath(dirname(resolved)), basename(resolved));
  } catch (error) {
    throw match(error)
      .with({ code: 'ENOENT' }, () => new Errors.NOT_FOUND({ resource: 'backup', cause: error }))
      .otherwise(() => error);
  }
}

export function backupOutside(source: string, destination: string) {
  match(source === destination || backupContains(source, destination) || backupContains(destination, source))
    .with(true, () => {
      throw new Errors.FORBIDDEN({ internal: 'Backup paths must not overlap' });
    })
    .with(false, () => undefined)
    .exhaustive();
}

export async function backupAssertAbsent(path: string) {
  try {
    await lstat(path);
  } catch (error) {
    match(error)
      .with({ code: 'ENOENT' }, () => undefined)
      .otherwise(() => {
        throw error;
      });

    return;
  }

  throw new Errors.CONFLICT({ internal: 'Backup path already exists' });
}

export async function backupAssertSource(root: string) {
  await backupAssertDirectory(root);
  await backupSerial([BACKUP.files.runtime, BACKUP.files.database, BACKUP.files.credentials], async (path) => {
    await backupAssertFile(await backupContained(root, path));
  });
  await backupAssertDirectory(await backupContained(root, BACKUP.directories.agents));
}

export async function backupStage(destination: string) {
  await backupAssertAbsent(destination);
  const staging = join(dirname(destination), `.openbots-backup-${crypto.randomUUID()}`);
  await mkdir(staging, { mode: DIRECTORY_MODE });

  return staging;
}

export async function backupPublish(staging: string, destination: string) {
  try {
    await mkdir(destination, { recursive: false, mode: DIRECTORY_MODE });
  } catch (error) {
    throw match(error)
      .with({ code: 'EEXIST' }, () => new Errors.CONFLICT({ internal: 'Backup path already exists', cause: error }))
      .otherwise(() => error);
  }

  try {
    await rename(staging, destination);
  } catch (error) {
    await rmdir(destination).catch(() => undefined);
    throw error;
  }
}

export async function backupRemoveStaging(staging: string) {
  await rm(staging, { recursive: true, force: true });
}

export async function backupPopulateCreate(root: string, staging: string) {
  await mkdir(join(staging, BACKUP.directories.data), { mode: DIRECTORY_MODE });
  await mkdir(join(staging, BACKUP.directories.agents), { mode: DIRECTORY_MODE });
  await backupVacuum(await backupContained(root, BACKUP.files.runtime), join(staging, BACKUP.files.runtime));
  await backupVacuum(await backupContained(root, BACKUP.files.database), join(staging, BACKUP.files.database));
  await backupCopyFile(await backupContained(root, BACKUP.files.credentials), join(staging, BACKUP.files.credentials));

  const files = [
    await backupManifestEntry(BACKUP.files.runtime, join(staging, BACKUP.files.runtime)),
    await backupManifestEntry(BACKUP.files.database, join(staging, BACKUP.files.database)),
    await backupManifestEntry(BACKUP.files.credentials, join(staging, BACKUP.files.credentials)),
  ];

  const directories: string[] = [];
  const agents = await backupContained(root, BACKUP.directories.agents);
  await backupWalk(root, agents, join(staging, BACKUP.directories.agents), BACKUP.directories.agents, files, directories);
  await backupWriteManifest(staging, files, directories);
}

export async function backupPopulateRestore(bundle: string, staging: string) {
  const manifest = await backupReadManifest(bundle);
  await mkdir(join(staging, BACKUP.directories.data), { mode: DIRECTORY_MODE });
  await mkdir(join(staging, BACKUP.directories.agents), { mode: DIRECTORY_MODE });

  await backupSerial([...manifest.directories].sort((left, right) => left.localeCompare(right)), async (directory) => {
    await mkdir(join(staging, backupAllowedPath(directory)), { recursive: true, mode: DIRECTORY_MODE });
  });

  await backupSerial(manifest.files, async (file) => {
    const path = backupAllowedPath(file.path);
    const source = await backupContained(bundle, path);
    await backupAssertFile(source);
    const destination = join(staging, path);
    await backupCopyFile(source, destination);
    const actual = await backupManifestEntry(path, destination);
    match(actual.size === file.size && actual.sha256 === file.sha256)
      .with(true, () => undefined)
      .with(false, () => {
        throw new Errors.VALIDATION_ERROR({
          fields: { bundle: { message: 'validation_backup_checksum' } },
        });
      })
      .exhaustive();

  });

  await backupAssertSource(staging);
}

function backupContains(root: string, path: string) {
  const inside = relative(root, path);
  return inside !== '' && inside !== '..' && !inside.startsWith(`..${sep}`) && !isAbsolute(inside);
}

function backupRelativePath(path: string) {
  const parts = path.split('/');
  match(parts.every((part) => part !== '' && part !== '.' && part !== '..'))
    .with(true, () => undefined)
    .with(false, () => {
      throw new Errors.FORBIDDEN({ internal: 'Backup path is not a safe relative path' });
    })
    .exhaustive();

  return path;
}

function backupAllowedPath(path: string) {
  const relativePath = backupRelativePath(path);
  match(
    relativePath === BACKUP.files.runtime
    || relativePath === BACKUP.files.database
    || relativePath === BACKUP.files.credentials
    || relativePath === BACKUP.directories.agents
    || relativePath.startsWith(`${BACKUP.directories.agents}/`),
  )
    .with(true, () => undefined)
    .with(false, () => {
      throw new Errors.FORBIDDEN({ internal: 'Backup path is not part of the data root' });
    })
    .exhaustive();

  return relativePath;
}

async function backupSerial<Value>(values: readonly Value[], each: (value: Value) => Promise<void>) {
  await values.reduce(async (previous, value) => {
    await previous;
    await each(value);
  }, Promise.resolve());
}

async function backupContained(root: string, relativePath: string) {
  const base = await realpath(root);

  const path = await backupRelativePath(relativePath).split('/').reduce(async (previous, part) => {
    const current = join(await previous, part);
    const stats = await lstat(current);
    match(stats.isSymbolicLink())
      .with(true, () => {
        throw new Errors.FORBIDDEN({ internal: 'Backup refuses symbolic links' });
      })
      .with(false, () => undefined)
      .exhaustive();

    return current;
  }, Promise.resolve(root));

  const actual = await realpath(path);
  match(actual === base || backupContains(base, actual))
    .with(true, () => undefined)
    .with(false, () => {
      throw new Errors.FORBIDDEN({ internal: 'Backup refuses paths outside the data root' });
    })
    .exhaustive();

  return path;
}

async function backupAssertFile(path: string) {
  try {
    const stats = await lstat(path);
    match(stats.isFile())
      .with(true, () => undefined)
      .with(false, () => {
        throw new Errors.NOT_FOUND({ resource: 'backup' });
      })
      .exhaustive();
  } catch (error) {
    throw match(error)
      .with({ code: 'ENOENT' }, () => new Errors.NOT_FOUND({ resource: 'backup', cause: error }))
      .otherwise(() => error);
  }
}

async function backupAssertDirectory(path: string) {
  try {
    const stats = await lstat(path);
    match({ isSymbolicLink: stats.isSymbolicLink(), isDirectory: stats.isDirectory() })
      .with({ isSymbolicLink: true }, () => {
        throw new Errors.FORBIDDEN({ internal: 'Backup refuses symbolic links' });
      })
      .with({ isDirectory: true }, () => undefined)
      .otherwise(() => {
        throw new Errors.NOT_FOUND({ resource: 'backup' });
      });
  } catch (error) {
    throw match(error)
      .with({ code: 'ENOENT' }, () => new Errors.NOT_FOUND({ resource: 'backup', cause: error }))
      .otherwise(() => error);
  }
}

async function backupVacuum(source: string, destination: string) {
  const database = new DatabaseSync(source);

  try {
    database.prepare('VACUUM INTO ?').run(destination);
  } finally {
    database.close();
  }

  await chmod(destination, FILE_MODE);
}

async function backupCopyFile(source: string, destination: string) {
  const stats = await lstat(source);
  match({ isSymbolicLink: stats.isSymbolicLink(), isFile: stats.isFile() })
    .with({ isSymbolicLink: true }, () => {
      throw new Errors.FORBIDDEN({ internal: 'Backup refuses symbolic links' });
    })
    .with({ isFile: true }, () => undefined)
    .otherwise(() => {
      throw new Errors.FORBIDDEN({ internal: 'Backup refuses unsupported file types' });
    });

  await mkdir(dirname(destination), { recursive: true, mode: DIRECTORY_MODE });
  const from = await open(source, constants.O_RDONLY | constants.O_NOFOLLOW);

  try {
    const to = await open(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, FILE_MODE);

    try {
      await pipeline(from.createReadStream(), to.createWriteStream());
    } finally {
      await to.close();
    }
  } finally {
    await from.close();
  }

  await chmod(destination, stats.mode & constants.S_IXUSR ? EXEC_MODE : FILE_MODE);
}

async function backupManifestEntry(relativePath: string, path: string): Promise<BackupManifestFile> {
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);

  try {
    const stats = await file.stat();
    const hash = createHash('sha256');
    await pipeline(file.createReadStream(), hash);

    return {
      path: backupRelativePath(relativePath),
      size: stats.size,
      sha256: hash.digest('hex'),
    };
  } finally {
    await file.close();
  }
}

async function backupWalk(
  root: string,
  source: string,
  destination: string,
  relativePath: string,
  files: BackupManifestFile[],
  directories: string[],
) {
  await backupSerial(await readdir(source, { withFileTypes: true }), async (entry) => {
    const next = backupAllowedPath(`${relativePath}/${entry.name}`);
    const from = await backupContained(root, next);
    const to = join(destination, entry.name);

    await match({
      isSymbolicLink: entry.isSymbolicLink(),
      isDirectory: entry.isDirectory(),
      isFile: entry.isFile(),
    })
      .with({ isSymbolicLink: true }, () => {
        throw new Errors.FORBIDDEN({ internal: 'Backup refuses symbolic links' });
      })
      .with({ isDirectory: true }, async () => {
        await mkdir(to, { recursive: true, mode: DIRECTORY_MODE });
        directories.push(next);
        await backupWalk(root, from, to, next, files, directories);
      })
      .with({ isFile: true }, async () => {
        await backupCopyFile(from, to);
        files.push(await backupManifestEntry(next, to));
      })
      .otherwise(() => {
        throw new Errors.FORBIDDEN({ internal: 'Backup refuses unsupported file types' });
      });
  });
}

async function backupWriteManifest(directory: string, files: BackupManifestFile[], directories: string[]) {
  const manifest: BackupManifest = {
    version: BACKUP.version,
    createdAt: Date.now(),
    files: [...files].sort((left, right) => left.path.localeCompare(right.path)),
    directories: [...directories].sort((left, right) => left.localeCompare(right)),
    excluded: BACKUP.excluded,
  };

  await writeFile(join(directory, BACKUP.manifest), `${JSON.stringify(backupManifest.parse(manifest), null, 2)}\n`, {
    mode: FILE_MODE,
    flag: 'wx',
  });
}

async function backupReadManifest(directory: string) {
  try {
    const path = await backupContained(directory, BACKUP.manifest);
    await backupAssertFile(path);

    return backupManifest.parse(JSON.parse(await readFile(path, 'utf8')));
  } catch (error) {
    throw new Errors.VALIDATION_ERROR({
      fields: { bundle: { message: 'validation_backup_manifest' } },
      cause: error,
    });
  }
}
