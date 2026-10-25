export const STORAGE = {
  current: 'runtime.sql',
  telemetry: 'telemetry.sql',
  telemetryRetentionMs: 14 * 24 * 60 * 60 * 1000,
  carry: 'carry.json',
  sidecars: ['', '-wal', '-shm'],
} as const;
