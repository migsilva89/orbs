import { CHAT } from '@openbots/client/client';
import { useQuery } from '@tanstack/react-query';
import { chatBlobUri } from '@/services/chat/chat.utils';
import type { RpcSession } from '@/types/rpc.types';

export function useAttachmentUri(session: RpcSession, botId: string, url: string) {
  const attachmentId = url.startsWith(CHAT.attachmentScheme) ? url.slice(CHAT.attachmentScheme.length) : undefined;

  const { data: uri } = useQuery({
    queryKey: ['attachment-uri', botId, attachmentId],
    enabled: attachmentId !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => chatBlobUri(await session.client.attachments.download({ botId, attachmentId: attachmentId ?? '' })),
  });

  return attachmentId === undefined ? url : uri;
}
