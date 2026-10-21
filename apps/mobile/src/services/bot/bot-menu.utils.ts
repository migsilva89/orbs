import { BOT_PERMISSION_LABELS, ROOMS_SEND_MODES } from '@openbots/client/client';
import { botFields, conversationWhenBusy } from '@openbots/contracts/universal';
import type { BotMenuPermissionsParams, BotMenuSendModesParams } from '@/types/bot-menu.types';
import type { MenuItem } from '@/types/menu.types';

export function botMenuSendModes({ defaultLabel, whenBusy, onSelect }: BotMenuSendModesParams): MenuItem[] {
  return [
    { label: defaultLabel, systemImage: whenBusy ? undefined : 'checkmark', onSelect: () => onSelect(null) },
    ...conversationWhenBusy.options.map((mode, index): MenuItem => ({
      label: ROOMS_SEND_MODES[mode](),
      systemImage: whenBusy === mode ? 'checkmark' : undefined,
      hasDividerBefore: index === 0,
      onSelect: () => onSelect(mode),
    })),
  ];
}

export function botMenuPermissions({ permission, onSelect }: BotMenuPermissionsParams): MenuItem[] {
  return botFields.shape.permission.options.map((option) => ({
    label: BOT_PERMISSION_LABELS[option](),
    systemImage: option === permission ? 'checkmark' : undefined,
    onSelect: () => onSelect(option),
  }));
}
