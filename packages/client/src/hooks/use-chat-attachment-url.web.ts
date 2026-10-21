import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CHAT } from '../services/chat/chat.constants';
import { useRpc } from './use-rpc';

/** A browser url for a message file: downloads `attachment:` links into an object url, passes other urls through. */
export function useChatAttachmentUrl(botId: string, url: string) {
  const { rpc } = useRpc();
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
