import path from 'node:path';
import { archAssertEmpty, archCamelCase, archDomainFromFile, archDynamicImports, archExportedDeclarations, archFilePrefix, archFormatDeclaration, archGlobToRegExp, archGroupByFile, archImports, archIsComponentLike, archListFiles, archMatchTemplate, archNameMatchesFilePrefix, archParseFile, archPascalCase, archPascalFromBasename, archResolveWorkspaceRoot, archTopLevelFunctions } from './arch.utils';
import type { ArchDeclaration, ArchMatchFileNameOptions } from '../types/arch.types';

export function arch() {
  return new Arch(archResolveWorkspaceRoot(process.cwd()));
}

class Arch {
  constructor(private readonly root: string) {}

  expect(pattern: string) {
    return new ArchExpectation({
      root: this.root,
      pattern,
      ignores: [],
    });
  }
}

class ArchExpectation {
  constructor(private readonly cfg: { root: string, pattern: string, ignores: string[] }) {}

  ignore(ignores: string[]) {
    return new ArchExpectation({ ...this.cfg, ignores: [...this.cfg.ignores, ...ignores] });
  }

  exports() {
    return new ArchSelection(this.cfg, async () => (await this.files()).flatMap((file) => archExportedDeclarations(file)));
  }

  topLevelFunctions() {
    return new ArchSelection(this.cfg, async () => (await this.files()).flatMap((file) => archTopLevelFunctions(file)));
  }

  fileNames() {
    return new ArchSelection(this.cfg, async () => (await this.files()).map((file) => ({ file, node: file.program, name: path.basename(file.relativePath) })));
  }

  imports() {
    return new ArchSelection(this.cfg, async () => (await this.files()).flatMap((file) => archImports(file)));
  }

  dynamicImports() {
    return new ArchSelection(this.cfg, async () => (await this.files()).flatMap((file) => archDynamicImports(file)));
  }

  async toContainNoFunctions() {
    const failures = (await this.topLevelFunctions().items()).map((item) => `${item.file.relativePath}: ${item.name}`);
    archAssertEmpty('Expected files to contain no functions.', failures);
  }

  async toOnlyHaveConstants() {
    const failures = (await this.files()).flatMap((file) => archExportedDeclarations(file)
      .filter((declaration) => declaration.node.type !== 'VariableDeclaration' || declaration.node.kind !== 'const')
      .map((declaration) => `${declaration.file.relativePath}: ${declaration.name}`));

    archAssertEmpty('Expected files to only export constants.', failures);
  }

  async toBeEmpty() {
    const failures = (await this.files()).map((file) => file.relativePath);
    archAssertEmpty('Expected glob to match no files.', failures);
  }

  get not() {
    return {
      toUse: async (methods: string[]) => {
        const failures = (await this.files()).flatMap((file) => methods
          .filter((method) => file.source.includes(`.${method}(`))
          .map((method) => `${file.relativePath}: ${method}`));

        archAssertEmpty('Expected files not to use restricted methods.', failures);
      },
      toImportFrom: async (patterns: string[]) => {
        const failures = (await this.imports().items()).flatMap((item) => patterns
          .filter((pattern) => archGlobToRegExp(pattern).test(item.name))
          .map((pattern) => `${item.file.relativePath}: ${item.name} matches ${pattern}`));

        archAssertEmpty('Expected files not to import from restricted paths.', failures);
      },
      toDynamicallyImportFrom: async (patterns: string[]) => {
        const failures = (await this.dynamicImports().items()).flatMap((item) => patterns
          .filter((pattern) => archGlobToRegExp(pattern).test(item.name))
          .map((pattern) => `${item.file.relativePath}: ${item.name} matches ${pattern}`));

        archAssertEmpty('Expected files not to dynamically import from restricted paths.', failures);
      },
      toContain: async (substrings: string[]) => {
        const failures = (await this.files()).flatMap((file) => substrings
          .filter((substring) => file.source.includes(substring))
          .map((substring) => `${file.relativePath}: contains ${JSON.stringify(substring)}`));

        archAssertEmpty('Expected files not to contain restricted substrings.', failures);
      },
    };
  }

  private async files() {
    const paths = await archListFiles(this.cfg.root);
    const matcher = archGlobToRegExp(this.cfg.pattern);
    const ignoreMatchers = this.cfg.ignores.map((ignore) => archGlobToRegExp(ignore));
    const matches = paths.filter((file) => matcher.test(file) && !ignoreMatchers.some((ignore) => ignore.test(file)));
    return Promise.all(matches.map((relativePath) => archParseFile(this.cfg.root, relativePath)));
  }
}

class ArchSelection<T extends ArchDeclaration> {
  constructor(private readonly cfg: { root: string, pattern: string, ignores: string[] }, private readonly load: () => Promise<T[]>) {}

  async items() {
    return this.load();
  }

  async toStartWithFilePrefix() {
    const failures = (await this.items())
      .filter((item) => !archNameMatchesFilePrefix(item.name, item.file.relativePath))
      .map((item) => `${item.file.relativePath}: ${item.name} (expected prefix: ${archFilePrefix(item.file.relativePath)})`);

    archAssertEmpty('Expected exports to start with their file prefix.', failures);
  }

  async toOnlyMatch(pattern: RegExp) {
    archAssertEmpty(`Expected names to match ${pattern}.`, (await this.items())
      .filter((item) => !pattern.test(item.name))
      .map(archFormatDeclaration));
  }

  async toMatchFileName(options: ArchMatchFileNameOptions) {
    const failures = (await this.items()).filter((item) => {
      const domain = archDomainFromFile(item.file.relativePath, options.file);

      if (!domain) {
        return false;
      }

      const expectedFunction = options.function.replace('{Domain}', archPascalCase(domain));
      const expectedType = options.type.replace('{Domain}', archPascalCase(domain));

      const expectedValues = [options.value ?? []]
        .flat()
        .map((value) => value.replace('{Domain}', archPascalCase(domain)).replace('{domain}', archCamelCase(domain)));

      return item.name !== expectedFunction && item.name !== expectedType && !expectedValues.includes(item.name);
    }).map(archFormatDeclaration);

    archAssertEmpty('Expected exports to match their file name.', failures);
  }

  async toMatchActionFileName() {
    archAssertEmpty('Expected action file names to match {domain}-action.{verb}.ts.', (await this.items())
      .filter((item) => !/^[a-z0-9]+(?:-[a-z0-9]+)*-action\.[a-z0-9]+(?:[-.][a-z0-9]+)*\.ts$/.test(item.name))
      .map(archFormatDeclaration));
  }

  async toMatchQueryFileName() {
    archAssertEmpty('Expected query file names to match {domain}-query.{name}.ts.', (await this.items())
      .filter((item) => !/^[a-z0-9]+(?:-[a-z0-9]+)*-query\.[a-z0-9]+(?:[-.][a-z0-9]+)*\.ts$/.test(item.name))
      .map(archFormatDeclaration));
  }

  async toOnlyExport(templates: string[]) {
    const byFile = archGroupByFile(await this.items());
    const failures: string[] = [];

    for (const { file, decls } of byFile.values()) {
      const domain = path.basename(file.relativePath).split('.')[0] ?? '';

      const allowed = templates.map((template) => template
        .replace('{Domain}', archPascalCase(domain))
        .replace('{domain}', archCamelCase(domain)));

      for (const decl of decls) {
        if (!allowed.includes(decl.name)) {
          failures.push(`${file.relativePath}: ${decl.name} (allowed: ${allowed.join(', ')})`);
        }
      }
    }

    archAssertEmpty('Expected files to only export listed names.', failures);
  }

  async toMatchFolderPrefix() {
    const seen = new Set<string>();
    const failures: string[] = [];

    for (const item of await this.items()) {
      if (seen.has(item.file.relativePath)) {
        continue;
      }
      seen.add(item.file.relativePath);

      const folder = path.basename(path.dirname(item.file.relativePath));
      const singular = folder.endsWith('s') ? folder.slice(0, -1) : folder;
      const stem = path.basename(item.file.relativePath).replace(/\.(tsx?|jsx?)$/, '');

      const matches = [
        stem === folder,
        stem === singular,
        stem.startsWith(`${folder}-`),
        stem.startsWith(`${singular}-`),
      ].some(Boolean);

      if (!matches) {
        failures.push(`${item.file.relativePath}: expected ${folder}- or ${singular}- prefix`);
      }
    }

    archAssertEmpty('Expected file names to start with their parent folder name (or its singular form).', failures);
  }

  async toMatchComponentExport() {
    const byFile = archGroupByFile(await this.items());
    const failures: string[] = [];

    for (const { file, decls } of byFile.values()) {
      const expected = archPascalFromBasename(path.basename(file.relativePath));
      const components = decls.filter((decl) => archIsComponentLike(decl));

      if (components.length === 0) {
        continue;
      }

      const expectedKey = expected.toLowerCase();
      const exact = components.some((decl) => decl.name.toLowerCase() === expectedKey);
      const allPrefixed = components.every((decl) => decl.name.toLowerCase().startsWith(expectedKey));

      if (!exact && !allPrefixed) {
        failures.push(`${file.relativePath}: expected ${expected}* (got ${components.map((decl) => decl.name).join(', ')})`);
      }
    }

    archAssertEmpty('Expected component exports to match file name.', failures);
  }

  async toMatchFactoryName(fileTemplate: string, fnTemplate: string) {
    const byFile = archGroupByFile(await this.items());
    const failures: string[] = [];

    for (const { file, decls } of byFile.values()) {
      const groups = archMatchTemplate(path.basename(file.relativePath), fileTemplate);

      if (!groups) {
        continue;
      }

      const expected = fnTemplate
        .replace('{Domain}', archPascalCase(groups.domain))
        .replace('{domain}', archCamelCase(groups.domain))
        .replace('{Name}', archPascalCase(groups.name));

      if (!decls.some((decl) => decl.name === expected)) {
        failures.push(`${file.relativePath}: expected ${expected}`);
      }
    }

    archAssertEmpty('Expected factory exports to match file name template.', failures);
  }

  async toOnlyMatchFactoryName(fileTemplate: string, fnTemplate: string) {
    const failures: string[] = [];

    for (const item of await this.items()) {
      const groups = archMatchTemplate(path.basename(item.file.relativePath), fileTemplate);

      if (!groups) {
        continue;
      }

      const expected = fnTemplate
        .replace('{Domain}', archPascalCase(groups.domain))
        .replace('{domain}', archCamelCase(groups.domain))
        .replace('{Name}', archPascalCase(groups.name));

      if (item.name !== expected) {
        failures.push(`${item.file.relativePath}: ${item.name} (expected ${expected})`);
      }
    }

    archAssertEmpty('Expected declarations to match file factory name.', failures);
  }

  get not() {
    return new ArchExpectation(this.cfg).not;
  }
}
