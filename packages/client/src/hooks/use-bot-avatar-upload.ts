import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';

/** Uploads a picked photo as a bot avatar; the result goes into the bot form like any other avatar. */
export function useBotAvatarUpload() {
  const { rpc } = useRpc();

  return useMutation(rpc.avatars.upload.mutationOptions({ meta: { error: m.avatars_upload_error() } }));
}
