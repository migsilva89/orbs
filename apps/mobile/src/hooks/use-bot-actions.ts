import { ROOMS_MUTE_DURATIONS } from '@repo/client/client';
import { useChatSettings } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { botMenuSendModes } from '@/services/bot/bot-menu.utils';
import type { MenuItem } from '@/types/menu.types';
import type { ConversationListItem } from '@repo/contracts/universal';

export function useBotActions(chat: ConversationListItem): MenuItem[] {
  const router = useRouter();
  const settings = useChatSettings(chat.botId);
  const { botId } = chat;

  const pinItems: MenuItem[] = chat.isHidden ? [] : [{
    label: chat.isPinned ? m.rooms_action_unpin() : m.rooms_action_pin(),
    systemImage: chat.isPinned ? 'pin.slash' : 'pin',
    onSelect: () => settings.pin(!chat.isPinned),
  }];

  const muteItem: MenuItem = chat.isMuted
    ? { label: m.rooms_unmute(), systemImage: 'bell', onSelect: settings.unmute }
    : {
      label: m.rooms_mute(),
      systemImage: 'bell.slash',
      items: ROOMS_MUTE_DURATIONS.map((item) => ({
        label: item.label(),
        onSelect: () => settings.mute(item.duration),
      })),
    };

  const sendModeItem: MenuItem = {
    label: m.rooms_action_send_mode(),
    systemImage: 'list.number',
    items: botMenuSendModes({
      defaultLabel: settings.defaultSendModeLabel,
      whenBusy: chat.whenBusy,
      onSelect: settings.setSendMode,
    }),
  };

  return [
    { label: m.rooms_action_edit_bot(), systemImage: 'pencil.line', onSelect: () => router.push({ pathname: '/bots/[botId]/edit', params: { botId } }) },
    ...pinItems,
    {
      label: chat.isHidden ? m.rooms_action_unhide() : m.rooms_action_hide(),
      systemImage: chat.isHidden ? 'eye' : 'eye.slash',
      onSelect: () => settings.hide(!chat.isHidden),
    },
    muteItem,
    sendModeItem,
    {
      label: m.rooms_member_reset(),
      systemImage: 'arrow.counterclockwise',
      hasDividerBefore: true,
      onSelect: () => router.push({ pathname: '/chat/[botId]/reset', params: { botId } }),
    },
    {
      label: m.rooms_bot_delete(),
      systemImage: 'trash',
      isDestructive: true,
      onSelect: () => router.push({ pathname: '/bots/[botId]/delete', params: { botId } }),
    },
  ];
}
