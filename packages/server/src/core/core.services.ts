import { makeRuntimeService } from '@openbots/runtime/server';
import { makeAuthService } from '../services/auth/auth.service';
import type { CoreServicesParams } from '../types/core.types';

export async function makeServices({ database, ...runtime }: CoreServicesParams) {
  return {
    database,
    auth: makeAuthService({ database }),
    conversation: await makeRuntimeService(runtime),
  };
}
