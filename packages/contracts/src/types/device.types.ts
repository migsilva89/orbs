import { z } from 'zod';

export const device = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.number().int(),
});

export const deviceList = z.array(device);

export const deviceRevoke = device.pick({ id: true });
export const deviceRevokeResult = z.void();
