#!/usr/bin/env bun
import { env } from '@repo/env/server';
import { isAppError } from '@repo/errors/universal';
import { initNativeLogger, log } from '@repo/logger/server';
import { match } from 'ts-pattern';
import { coreNativeCommand } from './core/core.native';

initNativeLogger(env.LOG_LEVEL);

try {
  await coreNativeCommand();
} catch (error) {
  process.exitCode = 1;
  log.error({
    tag: 'daemon',
    message: match(error).when(isAppError, (failure) => failure.internal).otherwise(() => 'Daemon command failed'),
    error,
  });
}
