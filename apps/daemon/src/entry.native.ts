import { env } from '@openbots/env/server';
import { initNativeLogger, log } from '@openbots/logger/server';
import { coreNativeRun } from './core/core.native';

initNativeLogger(env.OPENBOTS_LOG_LEVEL);

try {
  await coreNativeRun();
  log.info({ tag: 'daemon', message: 'Daemon stopped' });
} catch (error) {
  process.exitCode = 1;
  log.error({
    tag: 'daemon',
    message: 'Daemon failed',
    error,
  });
}
