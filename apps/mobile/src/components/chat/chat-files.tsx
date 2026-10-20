import { MessageFile, MessageImage } from '@/components/ui/message';
import { useAttachmentUri } from '@/hooks/use-attachment-uri';
import type { RpcSession } from '@/types/rpc.types';
import type { RoomsFilePart } from '@openbots/client/client';

interface ChatFilesItemProps {
  session: RpcSession;
  botId: string;
  file: RoomsFilePart;
}

function ChatFilesItem({ session, botId, file }: ChatFilesItemProps) {
  const uri = useAttachmentUri(session, botId, file.url);
  const name = file.filename ?? '';

  return file.mediaType.startsWith('image/') ? <MessageImage name={name} uri={uri} /> : <MessageFile name={name} />;
}

interface ChatFilesProps {
  session: RpcSession;
  botId: string;
  files: RoomsFilePart[];
}

export function ChatFiles({ session, botId, files }: ChatFilesProps) {
  return files.map((file) => (
    <ChatFilesItem
      botId={botId}
      file={file}
      key={file.url}
      session={session}
    />
  ));
}
