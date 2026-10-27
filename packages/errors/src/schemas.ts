import { COMMON_ERROR_STATUS_MAP } from '@orpc/client';
import { createErrors, createErrorStatusMap, isBaseAppError } from './errors';
import { errorSchemas } from './types/errors.types';
import type { ErrorsCode, ErrorsInstance } from './types/errors.types';

export const Errors = createErrors(errorSchemas);
export const errorStatusMap = { ...COMMON_ERROR_STATUS_MAP, ...createErrorStatusMap(errorSchemas) };

export function isAppError(error: unknown): error is ErrorsInstance<ErrorsCode> {
  return isBaseAppError(error);
}
