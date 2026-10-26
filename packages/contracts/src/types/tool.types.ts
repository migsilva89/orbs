import { z } from 'zod';

export const toolApprovalRules = z.array(z.object({
  when: z.string().trim().min(1).max(300),
  behavior: z.enum(['allow', 'ask']),
})).max(50);

export const TOOL_APPROVAL = {
  timeoutMinutes: [1, 2, 3, 5, 10],
  defaultTimeoutMinutes: 5,
} as const;

export const toolApprovalTimeout = z.number().int().min(1).max(10);

export const toolSettings = z.object({
  isJevConfigured: z.boolean(),
  approvalRules: toolApprovalRules,
  approvalTimeoutMinutes: toolApprovalTimeout,
});

export const toolConfigure = toolSettings.pick({ approvalRules: true, approvalTimeoutMinutes: true }).extend({
  jevApiKey: z.string().trim().min(1).max(8192).nullable(),
}).partial();

export const toolPending = z.object({ botId: z.uuid() });

export const toolApproval = z.object({
  id: z.number().int().positive(),
  botId: z.uuid(),
  conversationId: z.number().int().positive(),
  privateWith: z.uuid().nullable(),
  toolName: z.string(),
  arguments: z.json(),
  createdAt: z.number().int(),
  expiresAt: z.number().int(),
});

export const toolApprovalList = z.array(toolApproval);

export const toolAlwaysAllowed = z.array(z.string().min(1).max(200)).max(200);

export const toolAnswer = toolPending.extend({
  id: z.number().int().positive(),
  approved: z.boolean(),
  always: z.boolean().optional(),
});

export const toolAnswerResult = z.object({ accepted: z.boolean() });

export const toolSettingsForm = z.object({
  approvalRules: toolApprovalRules,
  approvalTimeoutMinutes: toolApprovalTimeout,
  jevApiKey: z.string().trim().max(8192),
});

export type ToolConfigureInput = z.infer<typeof toolConfigure>;
export type ToolSettings = z.infer<typeof toolSettings>;
export type ToolPendingInput = z.infer<typeof toolPending>;
export type ToolApproval = z.infer<typeof toolApproval>;
export type ToolAnswerInput = z.infer<typeof toolAnswer>;
export type ToolSettingsForm = z.infer<typeof toolSettingsForm>;
export type ToolApprovalRule = z.infer<typeof toolApprovalRules>[number];
