import assert from 'node:assert';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseSync } from 'oxc-parser';
import type * as ArchTypes from '../types/arch.types';

const fileCache = new Map<string, ArchTypes.ArchFileInfo>();

export function archPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

export function archCamelCase(value: string): string {
  const next = archPascalCase(value);
  return `${next.charAt(0).toLowerCase()}${next.slice(1)}`;
}

export function archExportedDeclarations(file: ArchTypes.ArchFileInfo): (ArchTypes.ArchDeclaration | ArchTypes.ArchFunctionDeclaration)[] {
  return archProgramBody(file).flatMap((node) => {
    if (node.type !== 'ExportNamedDeclaration' && node.type !== 'ExportDefaultDeclaration') {
      return [];
    }

    return archDeclarationsFromNode(file, node.declaration);
  });
}

export function archTopLevelFunctions(file: ArchTypes.ArchFileInfo): ArchTypes.ArchFunctionDeclaration[] {
  return archProgramBody(file).flatMap((node) => archFunctionFromNode(file, archUnwrapExport(node)));
}

export function archImports(file: ArchTypes.ArchFileInfo) {
  return archProgramBody(file)
    .filter((node: ArchTypes.ArchNode) => node.type === 'ImportDeclaration')
    .map((node: ArchTypes.ArchNode) => ({ file, node, name: node.source?.value ?? '' }));
}

export function archDynamicImports(file: ArchTypes.ArchFileInfo) {
  return [...file.source.matchAll(/\bimport\s*\(\s*(['"])([^'"]+)\1\s*\)/g)]
    .map((match) => ({ file, node: file.program, name: match[2] }));
}

function archDeclarationsFromNode(file: ArchTypes.ArchFileInfo, node?: ArchTypes.ArchNode): (ArchTypes.ArchDeclaration | ArchTypes.ArchFunctionDeclaration)[] {
  if (!node) {
    return [];
  }

  if (node.type === 'VariableDeclaration') {
    return (node.declarations ?? []).map((declaration) => ({ file, node, name: declaration.id?.name ?? '<anonymous>' }));
  }

  if (node.type === 'FunctionDeclaration') {
    return [{ file, node, name: node.id?.name ?? '<anonymous>', params: node.params ?? [], returnType: node.returnType }];
  }

  const name = node.id?.name;
  return name ? [{ file, node, name }] : [];
}

function archFunctionFromNode(file: ArchTypes.ArchFileInfo, node?: ArchTypes.ArchNode): ArchTypes.ArchFunctionDeclaration[] {
  if (node?.type === 'FunctionDeclaration') {
    return [{ file, node, name: node.id?.name ?? '<anonymous>', params: node.params ?? [], returnType: node.returnType }];
  }

  if (node?.type === 'VariableDeclaration') {
    return (node.declarations ?? []).flatMap((declaration) => {
      if (declaration.init?.type !== 'FunctionExpression' && declaration.init?.type !== 'ArrowFunctionExpression') {
        return [];
      }

      return [{
        file,
        node: declaration.init,
        name: declaration.id?.name ?? '<anonymous>',
        params: declaration.init.params ?? [],
        returnType: declaration.init.returnType,
      }];
    });
  }

  return [];
}

function archUnwrapExport(node: ArchTypes.ArchNode) {
  return node.type === 'ExportNamedDeclaration' || node.type === 'ExportDefaultDeclaration' ? node.declaration : node;
}

function archProgramBody(file: ArchTypes.ArchFileInfo) {
  return file.program.body ?? [];
}

export async function archParseFile(root: string, relativePath: string) {
  const absolutePath = path.join(root, relativePath);
  const cached = fileCache.get(absolutePath);

  if (cached) {
    return cached;
  }

  const source = await fs.readFile(absolutePath, 'utf8');
  const lang = absolutePath.endsWith('.tsx') ? 'tsx' : 'ts';
  const parsed = parseSync(absolutePath, source, { sourceType: 'module', lang });
  // SAFETY: oxc-parser's Program follows the same discriminated ESTree node contract traversed by these helpers.
  const file = { absolutePath, relativePath, source, program: parsed.program as ArchTypes.ArchNode };
  fileCache.set(absolutePath, file);

  return file;
}

export async function archListFiles(root: string) {
  const result: string[] = [];

  async function archWalk(directory: string) {
    const directories: string[] = [];

    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') {
        continue;
      }

      const absolutePath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        directories.push(absolutePath);
        continue;
      }

      result.push(path.relative(root, absolutePath).replaceAll(path.sep, '/'));
    }

    await Promise.all(directories.map((child) => archWalk(child)));
  }

  await archWalk(root);

  return result;
}

export function archGlobToRegExp(pattern: string) {
  let source = '';

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    const next = pattern[i + 1];
    const afterNext = pattern[i + 2];

    if (char === '*' && next === '*' && afterNext === '/') {
      source += '(?:.*/)?';
      i += 2;
      continue;
    }

    if (char === '*' && next === '*') {
      source += '.*';
      i += 1;
      continue;
    }

    if (char === '*') {
      source += '[^/]*';
      continue;
    }

    if (char === '{') {
      const end = pattern.indexOf('}', i);

      if (end !== -1) {
        const alternatives = pattern
          .slice(i + 1, end)
          .split(',')
          .map((alt) => alt.replaceAll(/[.+^${}()|[\]\\]/g, (match) => `\\${match}`));

        source += `(?:${alternatives.join('|')})`;
        i = end;
        continue;
      }
    }

    source += /[.+^${}()|[\]\\]/.test(char) ? `\\${char}` : char;
  }

  return new RegExp(`^${source}$`);
}

export function archResolveWorkspaceRoot(start: string) {
  let current = start;

  while (current !== path.dirname(current)) {
    const packagePath = path.join(current, 'package.json');

    if (fsSync.existsSync(packagePath)) {
      const pkg = JSON.parse(fsSync.readFileSync(path.join(current, 'package.json'), 'utf8'));

      if (Array.isArray(pkg.workspaces)) {
        return current;
      }
    }

    current = path.dirname(current);
  }

  return start;
}

export function archDomainFromFile(filePath: string, pattern: string) {
  const expectedSuffix = pattern.replace('{domain}', '');
  const fileName = path.basename(filePath);
  return fileName.endsWith(expectedSuffix) ? fileName.slice(0, -expectedSuffix.length) : null;
}

export function archFilePrefix(filePath: string) {
  return path.basename(filePath).split('.')[0] ?? '';
}

export function archNameMatchesFilePrefix(name: string, filePath: string) {
  const prefix = archFilePrefix(filePath).replaceAll('-', '').toLowerCase();
  const normalized = name.replaceAll('_', '').toLowerCase();
  return normalized.startsWith(prefix);
}

export function archIsComponentLike(decl: ArchTypes.ArchDeclaration): boolean {
  if (!/^[A-Z][a-z]/.test(decl.name)) {
    return false;
  }

  return decl.node.type === 'FunctionDeclaration' || decl.node.type === 'VariableDeclaration';
}

export function archPascalFromBasename(basename: string) {
  const stem = basename.replace(/\.(tsx?|jsx?)$/, '');
  return stem
    .split(/[-.]/)
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

export function archFormatDeclaration(item: ArchTypes.ArchDeclaration) {
  return `${item.file.relativePath}: ${item.name}`;
}

export function archAssertEmpty(message: string, failures: string[]) {
  if (failures.length === 0) {
    return;
  }

  assert.fail(`${message}\n${failures.join('\n')}`);
}

export function archGroupByFile<T extends ArchTypes.ArchDeclaration>(items: T[]) {
  const result = new Map<string, { file: ArchTypes.ArchFileInfo, decls: T[] }>();

  for (const item of items) {
    const entry = result.get(item.file.relativePath) ?? { file: item.file, decls: [] };
    entry.decls.push(item);
    result.set(item.file.relativePath, entry);
  }

  return result;
}

export function archMatchTemplate(basename: string, template: string): Record<string, string> | null {
  let pattern = '';
  let i = 0;

  while (i < template.length) {
    const char = template[i];

    if (char === '{') {
      const end = template.indexOf('}', i);

      if (end === -1) {
        return null;
      }

      const key = template.slice(i + 1, end);
      pattern += `(?<${key}>[a-z0-9-]+)`;
      i = end + 1;
      continue;
    }

    pattern += /[.+^${}()|[\]\\]/.test(char) ? `\\${char}` : char;
    i += 1;
  }

  const match = new RegExp(`^${pattern}$`).exec(basename);
  return match?.groups ?? null;
}
