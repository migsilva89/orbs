import { log as eventLog } from 'evlog';
import { storage } from './context';
import type { LoggerErrorDetails, LoggerFields, LoggerPayload } from './types/logger.types';

function toLogError(error: Error) {
  // SAFETY: Error subclasses may expose these optional fields; every field is checked before typed use.
  const details = error as LoggerErrorDetails;

  const result: LoggerFields = {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };

  const code = String(details.code);

  if (details.code === code) {
    result.code = code;
  }

  if (details.data !== undefined) {
    result.data = details.data;
  }

  const internal = String(details.internal);

  if (details.internal === internal) {
    result.internal = internal;
  }

  if (details.cause !== undefined) {
    result.cause = details.cause instanceof Error ? toLogError(details.cause) : details.cause;
  }

  return result;
}

const log = {
  debug(payload: LoggerPayload) {
    const { tag, message, ...fields } = payload;
    const requestLogger = storage.getStore();

    if (requestLogger) {
      requestLogger.info(message, { tag, ...fields });
      return;
    }

    eventLog.debug({
      tag,
      message,
      ...fields,
    });
  },
  error(payload: LoggerPayload) {
    const { tag, message, error, ...fields } = payload;
    const requestLogger = storage.getStore();
    const errArg = error instanceof Error ? error : message;

    if (requestLogger) {
      const requestFields: LoggerFields = { tag, message, ...fields };

      if (error !== undefined && !(error instanceof Error)) {
        requestFields.error = error;
      }
      requestLogger.error(errArg, requestFields);

      return;
    }

    const eventFields: LoggerFields = { tag, message, ...fields };

    if (error !== undefined) {
      eventFields.error = error instanceof Error ? toLogError(error) : error;
    }
    eventLog.error(eventFields);
  },
  info(payload: LoggerPayload) {
    const { tag, message, ...fields } = payload;
    const requestLogger = storage.getStore();

    if (requestLogger) {
      requestLogger.info(message, { tag, ...fields });
      return;
    }

    eventLog.info({
      tag,
      message,
      ...fields,
    });
  },
  warn(payload: LoggerPayload) {
    const { tag, message, ...fields } = payload;
    const requestLogger = storage.getStore();

    if (requestLogger) {
      requestLogger.warn(message, { tag, ...fields });
      return;
    }

    eventLog.warn({
      tag,
      message,
      ...fields,
    });
  },
};

export { log };
