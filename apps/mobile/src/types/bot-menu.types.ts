import type { BotPermission } from '@repo/client/client';
import type { ConversationWhenBusy } from '@repo/contracts/universal';

export interface BotMenuSendModesParams {
  defaultLabel: string;
  whenBusy: ConversationWhenBusy | null;
  onSelect: (whenBusy: ConversationWhenBusy | null) => void;
}

export interface BotMenuPermissionsParams {
  permission: BotPermission;
  onSelect: (permission: BotPermission) => void;
}
