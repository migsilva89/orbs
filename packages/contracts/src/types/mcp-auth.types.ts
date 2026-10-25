import { z } from 'zod';

export const mcpAuthTarget = z.object({
  botId: z.uuid(),
  name: z.string().trim().min(1).max(200),
});

export const mcpAuthStart = mcpAuthTarget.extend({
  redirectUrl: z.string().trim().min(1).max(4096),
  returnUrl: z.string().trim().max(4096).optional(),
});

export const mcpAuthComplete = mcpAuthTarget.extend({
  callbackUrl: z.string().trim().min(1).max(8192),
});

export const mcpAuthStatus = z.enum(['idle', 'pending', 'authorized']);

export const mcpAuthStartResult = z.discriminatedUnion('status', [
  z.object({ status: z.literal('authorized') }),
  z.object({
    status: z.literal('redirect'),
    authorizationUrl: z.string().min(1),
    state: z.string().min(1),
  }),
]);

export const mcpAuthCompleteResult = z.object({ status: z.literal('authorized') });
export const mcpAuthStatusResult = z.object({ status: mcpAuthStatus });
export const mcpAuthCancelResult = z.void();
export const mcpAuthLogoutResult = z.void();

export type McpAuthTarget = z.infer<typeof mcpAuthTarget>;
export type McpAuthStartInput = z.infer<typeof mcpAuthStart>;
export type McpAuthCompleteInput = z.infer<typeof mcpAuthComplete>;
export type McpAuthStartResult = z.infer<typeof mcpAuthStartResult>;
export type McpAuthCompleteResult = z.infer<typeof mcpAuthCompleteResult>;
export type McpAuthStatusResult = z.infer<typeof mcpAuthStatusResult>;
