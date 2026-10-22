import { modelSelection } from '@repo/contracts/universal';
import { z } from 'zod';
import type { Context } from '@earendil-works/pi-ai';
import type { ModelsSimpleStreamOptions } from '@earendil-works/pi-ai/models';

export const runtimeModelRoute = z.object({
  primary: modelSelection,
  fallback: modelSelection,
});

export type RuntimeModelRoute = z.infer<typeof runtimeModelRoute>;

export interface RuntimeModelRequest {
  route: RuntimeModelRoute;
  context: Context;
  options?: ModelsSimpleStreamOptions;
}
