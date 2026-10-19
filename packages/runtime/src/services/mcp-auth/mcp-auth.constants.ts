export const MCP_AUTH = {
  clientName: 'Openbots',
  credentialPrefix: 'mcp.auth.',
  pendingTtlMs: 10 * 60 * 1000,
  maxPending: 32,
  requestTimeoutMs: 30_000,
} as const;
