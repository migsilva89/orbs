export const PLUGIN = {
  indexes: ['index.ts', 'index.js', 'index.mjs'],
  skip: ['node_modules', '.git'],
  messages: {
    read: 'Cannot read plugin source.',
    import: 'Cannot import plugin.',
    invalid: 'Invalid plugin. Expected a default export Pi extension.',
  },
};
