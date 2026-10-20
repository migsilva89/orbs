#!/usr/bin/env bun
import { env } from '@openbots/env/server';
import { isAppError } from '@openbots/errors/universal';
import { initNativeLogger, log } from '@openbots/logger/server';
import { match } from 'ts-pattern';
import { coreCommandNative } from './core/core-command.native';

initNativeLogger(env.OPENBOTS_LOG_LEVEL);

try {
  await coreCommandNative();
} catch (error) {
  process.exitCode = 1;
  log.error({
    tag: 'daemon',
    message: match(error).when(isAppError, (failure) => failure.internal).otherwise(() => 'Daemon command failed'),
    error,
  });
}
