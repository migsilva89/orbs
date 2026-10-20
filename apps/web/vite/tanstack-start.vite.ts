import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { join } from 'node:path';
import { routes } from '../src/application/routes.ts';

export function createTanstackStartPlugin() {
  return tanstackStart({
    server: { entry: join('application', 'server.tanstack.ts') },
    router: {
      entry: join('application', 'router.tsx'),
      generatedRouteTree: join('application', 'routes.tree.ts'),
      quoteStyle: 'double',
      semicolons: true,
      virtualRouteConfig: routes,
    },
    importProtection: {
      behavior: {
        dev: 'mock',
        build: 'error',
      },
      log: 'always',
      maxTraceDepth: 30,
      client: {
        specifiers: [
          '@openbots/env/server',
          '@openbots/i18n/server',
          '@openbots/logger/server',
        ],
        files: ['**/*.server.*'],
      },
      server: {
        files: [],
      },
    },
  });
}
