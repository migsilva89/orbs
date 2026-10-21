import { useChatUploads } from './use-chat-uploads';
import type { ChatAttachmentsPlatformParams } from '../types/chat.types';
import type * as ReactTypes from 'react';

/** Composer attachments for the browser: files from the picker, drag and drop, or paste, with object-url previews. */
export function useChatAttachmentsWeb({ botId, onProblem }: ChatAttachmentsPlatformParams) {
  const files = useChatUploads<File>({
    botId,
    describe: (file) => ({ name: file.name, mediaType: file.type, size: file.size }),
    preview: (file) => URL.createObjectURL(file),
    read: async (file) => file,
    release: (item) => URL.revokeObjectURL(item.preview),
    onProblem,
  });

  const take = (event: ReactTypes.SyntheticEvent, sources: FileList) => {
    if (sources.length === 0) {
      return;
    }

    event.preventDefault();
    files.add([...sources]);
  };

  return {
    ...files,
    onDragOver: (event: ReactTypes.DragEvent) => {
      if (event.dataTransfer.types.includes('Files')) {
        event.preventDefault();
      }
    },
    onDrop: (event: ReactTypes.DragEvent) => take(event, event.dataTransfer.files),
    onPaste: (event: ReactTypes.ClipboardEvent) => take(event, event.clipboardData.files),
  };
}
