import { useChatAttachmentUrl } from '@repo/client/web';
import { messageSurface } from '@/components/ui/ai/message';
import { cn } from '@/lib/cn';
import IconLucideFileText from '~icons/lucide/file-text';
import type { RoomsFilePart } from '@repo/client/client';

interface RoomsChatFilesItemProps {
  botId: string
  file: RoomsFilePart
}

function RoomsChatFilesItem({ botId, file }: RoomsChatFilesItemProps) {
  const url = useChatAttachmentUrl(botId, file.url);

  if (file.mediaType.startsWith('image/')) {
    return (
      <a
        href={url}
        rel="noreferrer"
        target="_blank"
      >
        <img
          alt={file.filename ?? ''}
          className="max-h-64 rounded-3xl border border-input object-cover"
          loading="lazy"
          src={url}
        />
      </a>
    );
  }

  return (
    <a
      className={cn(messageSurface, 'flex h-8 max-w-full items-center gap-1.5 rounded-full px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring')}
      download={file.filename}
      href={url}
    >
      <IconLucideFileText className="size-4 shrink-0 text-muted-foreground" />
      <span className="max-w-56 truncate">{file.filename}</span>
    </a>
  );
}

interface RoomsChatFilesProps {
  botId: string
  files: RoomsFilePart[]
}

export function RoomsChatFiles({ botId, files }: RoomsChatFilesProps) {
  return (
    <div className="flex flex-col items-end gap-1 group-data-[role=assistant]:items-start">
      {files.map((file) => (
        <RoomsChatFilesItem
          botId={botId}
          file={file}
          key={file.url}
        />
      ))}
    </div>
  );
}
