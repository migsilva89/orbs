import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { toasty } from '@/components/ui/sonner';
import { rpc } from '@/services/rpc/rpc.client';

export function useRoomsHide() {
  const hide = useMutation(rpc.conversation.setHidden.mutationOptions({ onError: () => toasty(m.rooms_hide_failed(), '⚠️') }));

  return (botId: string, isHidden: boolean) => hide.mutate({ botId, isHidden });
}
