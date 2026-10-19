export const BACKUP = {
  version: 1,
  manifest: 'manifest.json',
  files: {
    runtime: 'data/runtime.sql',
    database: 'data/app.sqlite',
    credentials: 'data/credentials.key',
  },
  directories: {
    data: 'data',
    agents: 'agents',
  },
  excluded: {
    locks: true,
    ipc: true,
    providerAuth: 'Pi provider authentication lives outside the data root in the Pi agent directory and is not included.',
    sharedSources: 'Skill, plugin, and instruction paths outside the data root are not copied. Stored path strings remain in the app database.',
  },
} as const;
