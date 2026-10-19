export type NotificationKind = 'reply' | 'failure' | 'approval' | 'question';

export interface NotificationItem {
  kind: NotificationKind;
  botId: string;
  conversationId: number;
  taskId?: number;
  entryId?: number;
  expiresAt?: number;
}

export interface NotificationState {
  pending: NotificationItem[];
  recent: NotificationItem[];
}
