import { CHAT } from '@repo/client/client';
import { MessageFile, MessageImage } from '@/components/ui/message';
import { connectionFileSource } from '@/services/connection/connection.client';
import type { RpcSession } from '@/types/rpc.types';
import type { RoomsFilePart } from '@repo/client/client';

interface ChatFilesItemProps {
  session: RpcSession;
  botId: string;
  file: RoomsFilePart;
}

function ChatFilesItem({ session, botId, file }: ChatFilesItemProps) {
  const name = file.filename ?? '';

  const source = file.url.startsWith(CHAT.attachmentScheme)
    ? connectionFileSource(session.connection, { botId, attachmentId: file.url.slice(CHAT.attachmentScheme.length) })
    : { uri: file.url };

  return file.mediaType.startsWith('image/') ? <MessageImage name={name} source={source} /> : <MessageFile name={name} />;
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
