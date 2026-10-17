import type { AuthService } from '../services/auth/auth.service';
import type { AuthAuthenticateParams } from './auth.types';
import type { RuntimeService } from '@openbots/runtime/server';

export interface ConversationServiceDeps {
  auth: AuthService;
  runtime: RuntimeService;
}

export interface ConversationWatchParams extends AuthAuthenticateParams {
  deviceId: string;
  signal?: AbortSignal;
}
