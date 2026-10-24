export const SERVER = {
  idSetting: 'server.id',
  customAddressesSetting: 'server.addresses',
  wildcardHosts: new Set(['0.0.0.0', '::', '[::]']),
  loopbackHost: '127.0.0.1',
  tailscaleBinaries: ['/Applications/Tailscale.app/Contents/MacOS/Tailscale', '/usr/local/bin/tailscale', '/opt/homebrew/bin/tailscale', '/usr/bin/tailscale'],
  tailscaleTimeoutMs: 2000,
} as const;
