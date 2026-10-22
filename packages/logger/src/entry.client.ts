import { initLog, log } from 'evlog/client';

export function initClientLogger(options: Parameters<typeof initLog>[0] = {}): void {
  initLog({
    service: 'bots',
    minLevel: 'info',
    ...options,
  });
}

export { log };
