import type { ChatActivity, ChatMessage, ChatQueued } from '@repo/client/client';
import type * as UniversalTypes from '@repo/contracts/universal';

export interface LabChatFixture {
  bot: UniversalTypes.Bot;
  bots: UniversalTypes.Bot[];
  messages: ChatMessage[];
  draft: ChatMessage;
  reactions: Map<number, UniversalTypes.ConversationReaction>;
  approvals: UniversalTypes.ToolApproval[];
  questions: UniversalTypes.ConversationQuestion[];
  artifacts: UniversalTypes.Artifact[];
  activity: ChatActivity;
  queued: ChatQueued[];
  subagentViews: UniversalTypes.ConversationView[];
  subagentContexts: UniversalTypes.ConversationContextItem[];
}

export interface LabSubagentViewParams {
  botId: string;
  conversationId: number;
  task: string;
  replies: string[];
  isRunning: boolean;
  createdAt: number;
}
