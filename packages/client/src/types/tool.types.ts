import type { ChatMessage } from './chat.types';
import type { Bot, ToolCallArtifact, ToolCallSubagent } from '@openbots/contracts/universal';
import type { DynamicToolUIPart } from 'ai';

/** A tool call in a message, for clients that do not depend on the AI SDK. */
export type ToolPart = DynamicToolUIPart;

export interface ToolSubagent extends ToolCallSubagent {
  conversationId?: number;
}

type ToolMessagePart = ChatMessage['parts'][number];

export type ToolTextPart = Extract<ToolMessagePart, { type: 'text' }>;

export type ToolReasoningPart = Extract<ToolMessagePart, { type: 'reasoning' }>;

export type ToolBlock =
  | { kind: 'text'; index: number; parts: ToolTextPart[] }
  | { kind: 'reasoning'; index: number; parts: ToolReasoningPart[] }
  | { kind: 'tools'; index: number; parts: DynamicToolUIPart[] }
  | { kind: 'failure'; index: number; text: string }
  | { kind: 'artifact'; index: number; artifact: ToolCallArtifact }
  | { kind: 'subagent'; index: number; part: DynamicToolUIPart; subagent: ToolSubagent };

export interface ToolInputTextParams {
  input: DynamicToolUIPart['input'];
  key: string;
}

export interface ToolInputText {
  key: string;
  value: string;
}

export type ToolBot = Pick<Bot, 'name'> & Partial<Pick<Bot, 'avatar'>>;

export type ToolIconKind = 'terminal' | 'file' | 'edit' | 'search' | 'bot' | 'model' | 'question' | 'routine' | 'todo' | 'artifact' | 'mcp' | 'tool';

export interface ToolPresentation {
  label: string;
  icon: ToolIconKind;
}

export interface ToolPresentationDefinition {
  label: () => string;
  icon: ToolIconKind;
}

export interface ToolIdentity {
  name: string;
  identifier: string;
  isMcp: boolean;
}

export interface ToolBlocksParams {
  parts: ChatMessage['parts'];
  /** Drops tool calls and thinking, as the owner's hide-verbose setting asks. */
  hideVerbose?: boolean;
}

export interface ToolCollapsedParams {
  part: DynamicToolUIPart;
  grouped: boolean;
  expanded: boolean;
}

export interface ToolGroupStateParams {
  parts: DynamicToolUIPart[];
}
