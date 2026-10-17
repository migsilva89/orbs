import { env } from '@openbots/env/server';
import { initNativeLogger, log } from '@openbots/logger/server';
import { corePairNative } from './core/core-pair.native';
import { coreNativeRun } from './core/core.native';

initNativeLogger(env.OPENBOTS_LOG_LEVEL);

try {
  if (process.argv[2] === 'pair') {
    await corePairNative();
  } else {
    await coreNativeRun();
    log.info({ tag: 'daemon', message: 'Daemon stopped' });
  }
} catch (error) {
  process.exitCode = 1;
  log.error({
    tag: 'daemon',
    message: 'Daemon failed',
    error,
  });
}
