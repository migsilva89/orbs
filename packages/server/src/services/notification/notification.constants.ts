export const NOTIFICATION = {
  expoUrl: 'https://exp.host/--/api/v2/push/send',
  preferSetting: 'notification.prefer',
  openMs: 150_000,
  idleMs: 30 * 60_000,
  targetsMax: 500,
} as const;
