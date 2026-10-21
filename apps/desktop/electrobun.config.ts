import type { ElectrobunConfig } from 'electrobun';

export default {
  app: {
    name: 'Openbots',
    identifier: process.env.OPENBOTS_DESKTOP_ID ?? 'app.openbots.desktop',
    version: process.env.OPENBOTS_APP_VERSION ?? '0.0.0',
  },
  build: {
    mainProcess: 'bun',
    bun: { entrypoint: 'src/desktop.ts' },
    views: { connect: { entrypoint: 'src/views/connect/index.ts' } },
    copy: {
      'dist/openbots': 'views/openbots',
      'src/views/connect/index.html': 'views/connect/index.html',
    },
    mac: { codesign: false, notarize: false, createDmg: false, icons: 'icon.icon', bundleCEF: true, defaultRenderer: 'cef' },
  },
  scripts: { postBuild: '../../scripts/desktop-plist.ts' },
  runtime: { exitOnLastWindowClosed: false },
  release: { generatePatch: false },
} satisfies ElectrobunConfig;
