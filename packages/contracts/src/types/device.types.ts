import { z } from 'zod';

export const device = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.number().int(),
});

export const deviceList = z.array(device);

export const deviceRevoke = device.pick({ id: true });
export const deviceRevokeResult = z.void();

export const devicePush = z.object({ token: z.string().trim().min(1).max(256).nullable() });
export const devicePushResult = z.void();
export const devicePushData = z.object({ botId: z.uuid(), conversationId: z.number().int() });

export type Device = z.infer<typeof device>;
export type DevicePushInput = z.infer<typeof devicePush>;
