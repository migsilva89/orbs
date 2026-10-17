import { initLogger } from 'evlog';
import { storage } from './context';
import { log } from './logger.log';
import type { LogLevel } from 'evlog';

export function initNativeLogger(minLevel: LogLevel = 'info'): void {
  initLogger({
    env: { service: 'openbots' },
    minLevel,
  });
}

export { log, storage };
