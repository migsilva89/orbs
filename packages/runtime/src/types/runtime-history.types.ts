import { Type } from '@earendil-works/pi-ai';
import { z } from 'zod';
import type { RuntimeConversationParams } from './runtime.types';
import type { Cursor } from '@earendil-works/pi-durable';

export interface RuntimeHistorySearchParams extends RuntimeConversationParams {
  query: string;
  limit?: number;
  cursor?: Cursor;
}

export const runtimeHistoryToolPage = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  cursor: z.record(z.string(), z.json()).optional(),
}).strict();

export const runtimeHistoryToolSearch = runtimeHistoryToolPage.extend({
  query: z.string().trim().min(1).max(200),
}).strict();

export const runtimeHistoryToolPageParameters = Type.Unsafe<z.infer<typeof runtimeHistoryToolPage>>(
  z.toJSONSchema(runtimeHistoryToolPage),
);

export const runtimeHistoryToolSearchParameters = Type.Unsafe<z.infer<typeof runtimeHistoryToolSearch>>(
  z.toJSONSchema(runtimeHistoryToolSearch),
);
