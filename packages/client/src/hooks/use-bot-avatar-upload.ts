import { m } from '@repo/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';

export function useBotAvatarUpload() {
  const { rpc } = useRpc();

  return useMutation(rpc.avatars.upload.mutationOptions({ meta: { error: m.avatars_upload_error() } }));
}
