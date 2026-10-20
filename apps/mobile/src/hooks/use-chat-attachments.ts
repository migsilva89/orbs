import { ATTACHMENT } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { chatFileBlob } from '@/services/chat/chat.utils';
import type { ChatAttachment, ChatPicked } from '@/types/chat.types';
import type { RpcSession } from '@/types/rpc.types';

export function useChatAttachments(session: RpcSession, botId: string) {
  const toast = useToast();
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const upload = useMutation(session.rpc.attachments.upload.mutationOptions());
  const discard = useMutation(session.rpc.attachments.remove.mutationOptions());
  const remaining = ATTACHMENT.maxPerMessage - attachments.length;

  const update = (key: string, change: Partial<ChatAttachment>) => {
    setAttachments((items) => items.map((item) => (item.key === key ? { ...item, ...change } : item)));
  };

  const send = (key: string, item: Pick<ChatPicked, 'uri' | 'name'>) => {
    update(key, { status: 'uploading' });
    void chatFileBlob(item)
      .then((file) => upload.mutateAsync({ botId, file }))
      .then(
        (saved) => update(key, {
          id: saved.id,
          name: saved.name,
          status: 'ready',
        }),
        () => {
          update(key, { status: 'failed' });
          toast.show({ message: m.mobile_chat_attach_failed({ name: item.name }) });
        },
      );
  };

  const add = (picked: ChatPicked[]) => {
    const typed = picked.filter((item) => ATTACHMENT.mediaTypes.some((type) => type === item.mediaType));
    const sized = typed.filter((item) => item.size <= ATTACHMENT.maxBytes);
    const accepted = sized.slice(0, Math.max(0, remaining));

    const problem = [
      typed.length < picked.length ? m.rooms_files_type() : undefined,
      sized.length < typed.length ? m.rooms_files_too_big() : undefined,
      accepted.length < sized.length ? m.rooms_files_too_many({ count: ATTACHMENT.maxPerMessage }) : undefined,
    ].find(Boolean);

    if (problem) {
      toast.show({ message: problem });
    }

    for (const item of accepted) {
      const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const preview = item.mediaType.startsWith('image/') ? item.uri : '';

      setAttachments((items) => [...items, { key, id: null, uri: item.uri, name: item.name, mediaType: item.mediaType, preview, status: 'uploading' }]);
      send(key, item);
    }
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });

    if (!result.canceled) {
      add(result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.fileName ?? asset.uri.split('/').at(-1) ?? '',
        mediaType: asset.mimeType ?? '',
        size: asset.fileSize ?? 0,
      })));
    }
  };

  const pickFiles = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: [...ATTACHMENT.mediaTypes], multiple: true });

    if (!result.canceled) {
      add(result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mediaType: asset.mimeType ?? '',
        size: asset.size ?? 0,
      })));
    }
  };

  const remove = (key: string) => {
    const item = attachments.find((attachment) => attachment.key === key);

    if (item?.id) {
      discard.mutate({ botId, attachmentId: item.id });
    }

    setAttachments((items) => items.filter((attachment) => attachment.key !== key));
  };

  const retry = (key: string) => {
    const item = attachments.find((attachment) => attachment.key === key);

    if (item) {
      send(key, item);
    }
  };

  const clear = (ids: string[]) => {
    setAttachments((items) => items.filter((item) => !item.id || !ids.includes(item.id)));
  };

  return {
    attachments,
    readyIds: attachments.flatMap((item) => (item.id && item.status === 'ready' ? [item.id] : [])),
    uploading: attachments.some((item) => item.status === 'uploading'),
    isFull: remaining <= 0,
    pickPhotos,
    pickFiles,
    remove,
    retry,
    clear,
  };
}
