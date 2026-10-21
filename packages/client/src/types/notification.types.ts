import type { NotificationPlatform } from '@openbots/contracts/universal';

export interface NotificationPresenceParams {
  platform: NotificationPlatform;
  isOpen: boolean;
  idleMs: () => number;
}
