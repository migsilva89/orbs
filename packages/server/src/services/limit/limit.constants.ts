export const LIMIT = {
  setting: 'limits',
  defaults: {
    public: { maxRequests: 6000, windowMs: 60_000 },
    redeem: { maxRequests: 10, windowMs: 60_000 },
    device: { maxRequests: 600, windowMs: 60_000 },
    rpcInFlight: 32,
    watchInFlight: 64,
  },
};
