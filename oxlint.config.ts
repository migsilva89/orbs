import { preset } from 'oxlint-plugin-arch/preset';

export default preset({
  root: import.meta.dirname,
  folders: {
    '.': { layout: { suffixes: ['prompts', 'driver', 'options', 'extension', 'task'] } },
    '.agents': { console: true },
    'packages/server': { backend: { registry: { skip: ['backup'] } } },
  },
});
