import { initLogger } from 'evlog';
import { storage } from './context';
import { log } from './logger.log';
import { LOG_REDACT, redactSecrets } from './logger.redact';
import type { LogLevel } from 'evlog';

export function initNativeLogger(minLevel: LogLevel = 'info'): void {
  initLogger({
    env: { service: 'openbots' },
    minLevel,
    redact: LOG_REDACT,
  });
}

export { log, redactSecrets, storage };
