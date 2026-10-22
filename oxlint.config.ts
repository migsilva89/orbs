import preset from 'oxlint-plugin-arch/presets/tanstack-start-react-modules-preset';

export default preset({
  root: import.meta.dirname,
  architecture: {
    'apps/daemon': 'server',
    'apps/mobile': 'web',
    'apps/web': 'web',
    'apps/desktop': 'scripts',
    scripts: 'scripts',
    'packages/server': 'server',
    'packages/contracts': 'packages',
    'packages/client': 'packages',
    'packages/runtime': 'packages',
    'packages/secret-proxy': 'packages',
    'packages/avatar-blobs': 'packages',
    'packages/env': 'packages',
    'packages/errors': 'packages',
    'packages/i18n': 'packages',
    'packages/logger': 'packages',
    'packages/tanstack-helpers': 'packages',
    'packages/tooling': 'packages',
    'packages/typescript-config': 'packages',
  },
  modules: { customFileRoles: ['prompts', 'driver', 'options'] },
  tests: { additionalAssertionFunctions: ['arch.**.to*'] },
});
