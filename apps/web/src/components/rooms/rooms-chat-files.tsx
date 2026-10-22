import { useChatAttachmentUrl } from '@repo/client/web';
import { Button } from '@/components/ui/button';
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
          className="max-h-64 rounded-2xl object-cover"
          loading="lazy"
          src={url}
        />
      </a>
    );
  }

  return (
    <Button
      asChild
      size="sm"
      variant="outline"
    >
      <a download={file.filename} href={url}>
        <IconLucideFileText className="size-4 text-muted-foreground" />
        <span className="max-w-56 truncate">{file.filename}</span>
      </a>
    </Button>
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
