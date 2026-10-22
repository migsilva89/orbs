import type { NotificationPlatform } from '@repo/contracts/universal';

export interface NotificationPresenceParams {
  platform: NotificationPlatform;
  isOpen: boolean;
  idleMs: () => number;
}
