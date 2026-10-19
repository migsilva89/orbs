import { z } from 'zod';

export const limitWindow = z.object({
  maxRequests: z.number().int().min(1).max(1_000_000),
  windowMs: z.number().int().min(100).max(86_400_000),
});

export const limitSettings = z.object({
  public: limitWindow,
  redeem: limitWindow,
  device: limitWindow,
  rpcInFlight: z.number().int().min(1).max(10_000),
  watchInFlight: z.number().int().min(1).max(10_000),
});

export const limitConfigure = z.object({
  public: limitWindow.partial(),
  redeem: limitWindow.partial(),
  device: limitWindow.partial(),
  rpcInFlight: limitSettings.shape.rpcInFlight,
  watchInFlight: limitSettings.shape.watchInFlight,
}).partial();

export type LimitWindow = z.infer<typeof limitWindow>;
export type LimitSettings = z.infer<typeof limitSettings>;
export type LimitConfigureInput = z.infer<typeof limitConfigure>;
