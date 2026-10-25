import { ORPCError } from '@orpc/client';
import { errorsCauseMessageSchema } from './types/errors.types';
import type * as ErrorsTypes from './types/errors.types';

abstract class BaseAppError<TCode extends string, TData> extends ORPCError<TCode, TData> implements ErrorsTypes.ErrorsInstance<TCode, TData> {
  readonly reportable: boolean;
  readonly internal: string;
  override readonly cause?: ErrorsTypes.ErrorsCause;

  constructor(code: TCode, schema: ErrorsTypes.ErrorsDefinition, data: TData, options: ErrorsTypes.ErrorsThrowOptions) {
    super(code, {
      message: schema.message,
      data,
      cause: options.cause,
    });

    this.reportable = schema.reportable ?? true;
    this.cause = options.cause;

    const baseMessage = options.internal ?? schema.internal ?? schema.message;
    this.internal = buildInternalMessage(baseMessage, options.cause);
  }
}

function extractCauseMessage(cause: ErrorsTypes.ErrorsCause): string | null {
  if (!cause) {
    return null;
  }

  if (cause instanceof Error) {
    return cause.message;
  }

  const message = errorsCauseMessageSchema.safeParse(cause);

  if (message.success) {
    return message.data;
  }

  return null;
}

function buildInternalMessage(baseMessage: string, cause: ErrorsTypes.ErrorsCause): string {
  const causeMessage = extractCauseMessage(cause);
  return causeMessage ? `${baseMessage}: ${causeMessage}` : baseMessage;
}

function defineError<K extends string, S extends ErrorsTypes.ErrorsDefinition>(code: K, schema: S) {
  return class extends BaseAppError<K, ErrorsTypes.ErrorsSchemaData<S>> {
    constructor(input?: object) {
      // SAFETY: the public generated constructor type permits only schema data fields plus ErrorsThrowOptions.
      const { internal, cause, ...data } = (input ?? {}) as ErrorsTypes.ErrorsThrowOptions & ErrorsTypes.ErrorsSchemaData<S>;

      // SAFETY: removing every ErrorsThrowOptions key leaves exactly the schema-derived ErrorsSchemaData payload.
      super(code, schema, data as ErrorsTypes.ErrorsSchemaData<S>, {
        internal,
        cause,
      });
    }
  };
}

export function createErrors<T extends Record<string, ErrorsTypes.ErrorsDefinition>>(schemas: T) {
  // SAFETY: the loop below assigns one generated ErrorsClass for every own key of schemas before this object escapes.
  const errors = {} as { [K in keyof T]: ErrorsTypes.ErrorsClass<K & string, T[K]> };

  for (const code in schemas) {
    if (Object.hasOwn(schemas, code)) {
      // SAFETY: defineError receives the schema at this same key, preserving the mapped key/schema correlation.
      errors[code] = defineError(code, schemas[code]);
    }
  }

  return errors;
}

export function createErrorStatusMap<T extends Record<string, ErrorsTypes.ErrorsDefinition>>(schemas: T) {
  const statusMap: Partial<Record<keyof T, number>> = {};

  for (const code in schemas) {
    const status = schemas[code].status;

    if (Object.hasOwn(schemas, code) && status !== undefined) {
      statusMap[code] = status;
    }
  }

  return statusMap;
}

export function isBaseAppError(error: unknown): error is ErrorsTypes.ErrorsInstance {
  return error instanceof BaseAppError;
}
