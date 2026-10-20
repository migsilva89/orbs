import { CHAT } from '@openbots/client/client';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { rpc } from '@/services/rpc/rpc.client';

export function useAttachmentUrl(botId: string, url: string) {
  const attachmentId = url.startsWith(CHAT.attachmentScheme) ? url.slice(CHAT.attachmentScheme.length) : undefined;

  const { data: objectUrl } = useQuery({
    ...rpc.attachments.download.queryOptions({ input: { botId, attachmentId: attachmentId ?? '' } }),
    enabled: attachmentId !== undefined,
    staleTime: Number.POSITIVE_INFINITY,
    select: (file) => URL.createObjectURL(file),
  });

  useEffect(() => () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
  }, [objectUrl]);

  return attachmentId === undefined ? url : objectUrl;
}
