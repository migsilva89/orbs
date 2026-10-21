import { z } from 'zod';

export type NotificationKind = 'reply' | 'failure' | 'approval' | 'question';

export interface NotificationItem {
  kind: NotificationKind;
  botId: string;
  conversationId: number;
  taskId?: number;
  entryId?: number;
  expiresAt?: number;
  deliverHere?: boolean;
}

export interface NotificationState {
  pending: NotificationItem[];
  recent: NotificationItem[];
}

export const notificationPlatform = z.enum(['phone', 'computer']);

export const notificationPresence = z.object({
  platform: notificationPlatform,
  isOpen: z.boolean(),
  idleMs: z.number().int().nonnegative(),
});

export const notificationSettings = z.object({ prefer: notificationPlatform });
export const notificationConfigure = notificationSettings.partial();

export const notificationPush = z.object({
  token: z.string().trim().min(1).max(256).nullable(),
  url: z.url({ protocol: /^https?$/ }).max(512).nullable(),
});

export const notificationPushData = z.object({ botId: z.uuid(), conversationId: z.number().int() });
export const notificationVoid = z.void();

export type NotificationPlatform = z.infer<typeof notificationPlatform>;
export type NotificationPresenceInput = z.infer<typeof notificationPresence>;
export type NotificationSettings = z.infer<typeof notificationSettings>;
export type NotificationConfigureInput = z.infer<typeof notificationConfigure>;
export type NotificationPushInput = z.infer<typeof notificationPush>;
