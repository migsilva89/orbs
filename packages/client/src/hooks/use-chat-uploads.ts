import { ATTACHMENT } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { generateId } from 'ai';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useRpc } from './use-rpc';
import type { RoomsAttachmentsParams, RoomsSourcedAttachment } from '../types/rooms.types';

export function useChatUploads<Source>({ botId, describe, preview, read, release, onFailed, onProblem }: RoomsAttachmentsParams<Source>) {
  const { rpc } = useRpc();
  const [attachments, setAttachments] = useState<RoomsSourcedAttachment<Source>[]>([]);
  const [shownBotId, setShownBotId] = useState(botId);
  const kept = useRef(new Map<string, RoomsSourcedAttachment<Source>>());
  const upload = useMutation(rpc.attachments.upload.mutationOptions());
  const discard = useMutation(rpc.attachments.remove.mutationOptions());
  const remaining = ATTACHMENT.maxPerMessage - attachments.length;

  const releaseAll = useEffectEvent(() => {
    for (const item of kept.current.values()) {
      release?.(item);
    }

    kept.current.clear();
  });

  useEffect(() => () => releaseAll(), [botId]);

  if (shownBotId !== botId) {
    setShownBotId(botId);
    setAttachments([]);
  }

  const change = (key: string, update: Partial<RoomsSourcedAttachment<Source>>) => {
    setAttachments((items) => items.map((item) => (item.key === key ? { ...item, ...update } : item)));
  };

  const send = (item: RoomsSourcedAttachment<Source>) => {
    change(item.key, { status: 'uploading' });
    void read(item.source)
      .then((file) => upload.mutateAsync({ botId, file }))
      .then(
        (saved) => {
          if (!kept.current.has(item.key)) {
            discard.mutate({ botId, attachmentId: saved.id });
            return;
          }

          change(item.key, {
            id: saved.id,
            name: saved.name,
            status: 'ready',
          });
        },
        () => {
          change(item.key, { status: 'failed' });
          onFailed?.(item);
        },
      );
  };

  const add = (sources: Source[]) => {
    const files = sources.map((source) => ({ source, ...describe(source) }));
    const typed = files.filter((file) => ATTACHMENT.mediaTypes.some((type) => type === file.mediaType));
    const sized = typed.filter((file) => file.size <= ATTACHMENT.maxBytes);
    const accepted = sized.slice(0, Math.max(0, remaining));

    for (const file of accepted) {
      const item: RoomsSourcedAttachment<Source> = { key: generateId(), id: null, name: file.name, mediaType: file.mediaType, preview: preview(file.source), status: 'uploading', source: file.source };

      kept.current.set(item.key, item);
      setAttachments((items) => [...items, item]);
      send(item);
    }

    const problem = [
      typed.length < files.length ? m.rooms_files_type() : undefined,
      sized.length < typed.length ? m.rooms_files_too_big() : undefined,
      accepted.length < sized.length ? m.rooms_files_too_many({ count: ATTACHMENT.maxPerMessage }) : undefined,
    ].find(Boolean);

    if (problem) {
      onProblem(problem);
    }
  };

  const drop = (keys: string[]) => {
    for (const key of keys) {
      const item = kept.current.get(key);

      if (item) {
        release?.(item);
      }

      kept.current.delete(key);
    }

    setAttachments((items) => items.filter((item) => !keys.includes(item.key)));
  };

  const remove = (key: string) => {
    for (const attachmentId of attachments.flatMap((item) => (item.key === key && item.id ? [item.id] : []))) {
      discard.mutate({ botId, attachmentId });
    }

    drop([key]);
  };

  const retry = (key: string) => {
    const item = attachments.find((attachment) => attachment.key === key);

    if (item) {
      send(item);
    }
  };

  return {
    attachments,
    add,
    remove,
    retry,
    clear: (ids: string[]) => drop(attachments.flatMap((item) => (item.id && ids.includes(item.id) ? [item.key] : []))),
    readyIds: attachments.flatMap((item) => (item.id && item.status === 'ready' ? [item.id] : [])),
    uploading: attachments.some((item) => item.status === 'uploading'),
    failed: attachments.some((item) => item.status === 'failed'),
    isFull: remaining <= 0,
    remaining,
  };
}
