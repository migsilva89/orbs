import { ATTACHMENT } from '@openbots/contracts/universal';
import { Errors } from '@openbots/errors/universal';
import { m } from '@openbots/i18n/client';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { chatFileType } from '../services/chat/chat.utils';
import { useChatUploads } from './use-chat-uploads';
import type { ChatAttachmentsPlatformParams, ChatPicked } from '../types/chat.types';

/** Composer attachments for iOS and Android: photos and files from the system pickers, read from their local uri on upload. */
export function useChatAttachmentsNative({ botId, onProblem }: ChatAttachmentsPlatformParams) {
  const files = useChatUploads<ChatPicked>({
    botId,
    describe: (picked) => picked,
    preview: (picked) => (picked.mediaType.startsWith('image/') ? picked.uri : ''),
    read: readPicked,
    onFailed: (item) => onProblem(m.mobile_chat_attach_failed({ name: item.name })),
    onProblem,
  });

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: files.remaining,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (!result.canceled) {
      files.add(result.assets.map((asset) => {
        const name = asset.fileName ?? asset.uri.split('/').at(-1) ?? '';

        return {
          uri: asset.uri,
          name,
          mediaType: chatFileType({ name, mediaType: asset.mimeType }),
          size: asset.fileSize ?? 0,
        };
      }));
    }
  };

  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: [...ATTACHMENT.mediaTypes], multiple: true });

    if (!result.canceled) {
      files.add(result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mediaType: chatFileType({ name: asset.name, mediaType: asset.mimeType }),
        size: asset.size ?? 0,
      })));
    }
  };

  return { ...files, pickPhotos, pickFiles };
}

function readPicked({ uri, name }: ChatPicked): Promise<File> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.responseType = 'blob';
    request.onload = () => {
      // SAFETY: a 'blob' XHR response is a native Blob; an own writable `name` survives Expo's FormData, unlike `File.name`.
      resolve(Object.defineProperty(request.response as Blob, 'name', { value: name, writable: true }) as File);
    };
    request.onerror = () => reject(new Errors.INTERNAL_ERROR({ internal: `Could not read ${uri}` }));
    request.open('GET', uri);
    request.send();
  });
}
