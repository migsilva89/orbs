import { m } from '@repo/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';

export function useBotUpdate(success?: string) {
  const { rpc } = useRpc();

  return useMutation(rpc.bots.update.mutationOptions({
    meta: {
      success,
      error: m.rooms_bot_save_error(),
      invalidates: [rpc.bots.list.key(), rpc.bots.catalog.key(), rpc.skills.discover.key(), rpc.mcp.discover.key()],
    },
  }));
}
