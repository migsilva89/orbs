import type { Log } from 'evlog';

export type LoggerFields = Parameters<Log['info']>[0];

export type LoggerCause = ErrorOptions['cause'];

export type LoggerPayload = { tag: string; message: string; error?: LoggerCause } & LoggerFields;

export type LoggerErrorDetails = Error & { code?: LoggerCause; data?: LoggerCause; internal?: LoggerCause; cause?: LoggerCause };
