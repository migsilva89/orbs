import { m } from '@repo/i18n/client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ROOMS_SEND_MODES } from '../services/rooms/rooms.constants';
import { useRpc } from './use-rpc';
import type { ConversationWhenBusy } from '@repo/contracts/universal';

/** Per-chat pin, hide, mute and send-mode changes, each refreshing the chat list. */
export function useChatSettings(botId: string) {
  const { rpc } = useRpc();
  const meta = { error: m.rooms_hide_failed(), invalidates: [rpc.conversation.list.key()] };
  const { data: settings } = useQuery(rpc.conversation.settings.queryOptions());
  const pin = useMutation(rpc.conversation.setPinned.mutationOptions({ meta }));
  const hide = useMutation(rpc.conversation.setHidden.mutationOptions({ meta }));
  const mute = useMutation(rpc.conversation.setMuted.mutationOptions({ meta }));
  const sendMode = useMutation(rpc.conversation.setWhenBusy.mutationOptions({ meta }));

  return {
    defaultSendModeLabel: m.rooms_send_mode_default({ mode: settings ? ROOMS_SEND_MODES[settings.whenBusy]() : '…' }),
    isSendModePending: sendMode.isPending,
    pin: (isPinned: boolean) => pin.mutate({ botId, isPinned }),
    hide: (isHidden: boolean) => hide.mutate({ botId, isHidden }),
    unmute: () => mute.mutate({ botId, isMuted: false }),
    mute: (duration: number | null) => mute.mutate({
      botId,
      isMuted: true,
      mutedUntil: duration === null ? null : Date.now() + duration,
    }),
    setSendMode: (whenBusy: ConversationWhenBusy | null) => sendMode.mutate({ botId, whenBusy }),
  };
}
