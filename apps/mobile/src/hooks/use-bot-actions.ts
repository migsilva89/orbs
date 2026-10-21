import { ROOMS_MUTE_DURATIONS, ROOMS_SEND_MODES } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useToast } from '@/hooks/use-toast';
import { botMenuSendModes } from '@/services/bot/bot-menu.utils';
import type { MenuItem } from '@/types/menu.types';
import type { RpcSession } from '@/types/rpc.types';
import type { ConversationListItem } from '@openbots/contracts/universal';

export function useBotActions(session: RpcSession, chat: ConversationListItem): MenuItem[] {
  const queryClient = useQueryClient();
  const router = useRouter();
  const toast = useToast();
  const { data: settings } = useQuery(session.rpc.conversation.settings.queryOptions());
  const { botId } = chat;

  const settled = {
    onError: () => toast.show({ message: m.rooms_hide_failed() }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: session.rpc.conversation.list.key() }),
  };

  const pin = useMutation(session.rpc.conversation.setPinned.mutationOptions(settled));
  const hide = useMutation(session.rpc.conversation.setHidden.mutationOptions(settled));
  const mute = useMutation(session.rpc.conversation.setMuted.mutationOptions(settled));
  const setWhenBusy = useMutation(session.rpc.conversation.setWhenBusy.mutationOptions(settled));

  const pinItems: MenuItem[] = chat.isHidden ? [] : [{
    label: chat.isPinned ? m.rooms_action_unpin() : m.rooms_action_pin(),
    systemImage: chat.isPinned ? 'pin.slash' : 'pin',
    onSelect: () => pin.mutate({ botId, isPinned: !chat.isPinned }),
  }];

  const muteItem: MenuItem = chat.isMuted
    ? { label: m.rooms_unmute(), systemImage: 'bell', onSelect: () => mute.mutate({ botId, isMuted: false }) }
    : {
      label: m.rooms_mute(),
      systemImage: 'bell.slash',
      items: ROOMS_MUTE_DURATIONS.map((item) => ({
        label: item.label(),
        onSelect: () => mute.mutate({
          botId,
          isMuted: true,
          mutedUntil: item.duration === null ? null : Date.now() + item.duration,
        }),
      })),
    };

  const sendModeItem: MenuItem = {
    label: m.rooms_action_send_mode(),
    systemImage: 'list.number',
    items: botMenuSendModes({
      defaultLabel: m.rooms_send_mode_default({ mode: settings ? ROOMS_SEND_MODES[settings.whenBusy]() : '…' }),
      whenBusy: chat.whenBusy,
      onSelect: (whenBusy) => setWhenBusy.mutate({ botId, whenBusy }),
    }),
  };

  return [
    { label: m.rooms_action_edit_bot(), systemImage: 'pencil.line', onSelect: () => router.push({ pathname: '/bots/[botId]/edit', params: { botId } }) },
    ...pinItems,
    {
      label: chat.isHidden ? m.rooms_action_unhide() : m.rooms_action_hide(),
      systemImage: chat.isHidden ? 'eye' : 'eye.slash',
      onSelect: () => hide.mutate({ botId, isHidden: !chat.isHidden }),
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
