export const CONNECTION = {
  storageKey: 'bots.connection',
  pairingKey: 'bots.pairing',
  rpcPath: '/rpc',
  healthPath: '/health',
  cookieMaxAgeSeconds: 365 * 24 * 60 * 60,
  pairingMaxAgeSeconds: 10 * 60,
  targetCacheMs: 15_000,
  browsers: [
    ['Edge', /Edg(?:A|iOS)?\//u],
    ['Opera', /OPR\//u],
    ['Firefox', /Firefox\/|FxiOS/u],
    ['Chrome', /Chrome\/|CriOS/u],
    ['Safari', /Safari\//u],
  ],
  systems: [
    ['iPhone', /iPhone/u],
    ['iPad', /iPad/u],
    ['Android', /Android/u],
    ['macOS', /Mac OS X/u],
    ['Windows', /Windows/u],
    ['Linux', /Linux/u],
  ],
} as const;
