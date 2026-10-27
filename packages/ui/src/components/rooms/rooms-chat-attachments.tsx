import { m } from '@repo/i18n/client';
import { PromptInputAttachment, PromptInputDrawer, PromptInputDrawerAlert } from '../ai/prompt-input';
import { InputGroupAddon } from '../input-group';
import type { useChatAttachmentsWeb } from '@repo/client/web';

interface RoomsChatAttachmentsProps {
  files: ReturnType<typeof useChatAttachmentsWeb>
}

export function RoomsChatAttachments({ files }: RoomsChatAttachmentsProps) {
  if (files.attachments.length === 0) {
    return null;
  }

  const problem = files.failed && m.rooms_files_failed();

  return (
    <>
      {problem ? (
        <PromptInputDrawer variant="destructive">
          <PromptInputDrawerAlert>{problem}</PromptInputDrawerAlert>
        </PromptInputDrawer>
      ) : null}
      <InputGroupAddon align="block-start">
        <div className="flex flex-wrap gap-1">
          {files.attachments.map((item) => (
            <PromptInputAttachment
              image={item.mediaType.startsWith('image/')}
              key={item.key}
              name={item.name}
              preview={item.preview}
              removeLabel={m.rooms_files_remove()}
              status={item.status}
              onRemove={() => files.remove(item.key)}
            />
          ))}
        </div>
      </InputGroupAddon>
    </>
  );
}
