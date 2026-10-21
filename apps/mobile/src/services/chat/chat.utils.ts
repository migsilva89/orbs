import { botUsageLabel, htmlReplySegments, toolBlocks } from '@openbots/client/client';
import { Errors } from '@openbots/errors/universal';
import { getLocale, m } from '@openbots/i18n/client';
import { match } from 'ts-pattern';
import { CHAT_FILE_TYPES } from './chat.constants';
import type * as ChatTypes from '@/types/chat.types';
import type { ChatMessage } from '@openbots/client/client';

export function chatMessageDetails(message: ChatMessage): string[] {
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
  const sent = message.metadata ? [m.rooms_chat_sent({ date: date.format(new Date(message.metadata.createdAt)) })] : [];
  const usage = message.role === 'assistant' && message.metadata?.usage ? [botUsageLabel(message.metadata.usage)] : [];

  return [...sent, ...usage];
}

export function chatMessageSegments(message: ChatMessage): ChatTypes.ChatMessageSegment[] {
  const isReply = message.role !== 'user';
  const files = message.parts.filter((part) => part.type === 'file');
  const segments: ChatTypes.ChatMessageSegment[] = files.length > 0 ? [{ key: 'files', kind: 'bubbles', parts: [{ key: 'files', kind: 'files', files }] }] : [];

  for (const block of toolBlocks({ parts: message.parts })) {
    const tools = match(block)
      .with({ kind: 'tools' }, ({ parts }) => parts)
      .with({ kind: 'subagent' }, ({ part }) => [part])
      .otherwise(() => undefined);

    const parts = match(block)
      .returnType<ChatTypes.ChatMessagePart[]>()
      .with({ kind: 'text' }, (text) => text.parts.flatMap((part, index) => match(isReply && part.state !== 'streaming')
        .with(true, () => htmlReplySegments(part.text).map((segment, at) => ({ key: `${block.index}-${index}-${at}`, ...segment, isStreaming: false })))
        .otherwise(() => [{ key: `${block.index}-${index}`, kind: 'markdown', text: part.text, isStreaming: part.state === 'streaming' }])))
      .with({ kind: 'reasoning' }, (reasoning) => [{
        key: `${block.index}`,
        kind: 'reasoning',
        text: reasoning.parts.map((part) => part.text).join('\n\n'),
        isStreaming: reasoning.parts.some((part) => part.state === 'streaming'),
      }])
      .with({ kind: 'failure' }, (failure) => [{
        key: `${block.index}`,
        kind: 'failure',
        text: failure.text,
        isStreaming: false,
      }])
      .with({ kind: 'artifact' }, (artifact) => [{
        key: `${block.index}`,
        kind: 'artifact',
        artifact: artifact.artifact,
      }])
      .otherwise(() => []);

    const last = segments.at(-1);

    if (tools) {
      segments.push({
        key: `tools-${block.index}`,
        kind: 'tools',
        parts: tools,
      });
    } else if (last?.kind === 'bubbles') {
      last.parts.push(...parts);
    } else if (parts.length > 0) {
      segments.push({
        key: `bubbles-${block.index}`,
        kind: 'bubbles',
        parts,
      });
    }
  }

  return segments;
}

export function chatNoticeTitle({ message, bot }: ChatTypes.ChatNoticeTitleParams): string {
  const name = message.metadata?.authorName ?? '';
  const part = message.parts.at(0);

  if (part?.type === 'data-pair') {
    return match(part.data.kind)
      .with('ask', () => m.rooms_pair_asked({ asker: name, bot: bot.name }))
      .with('reply', () => m.rooms_pair_replied({ bot: name }))
      .with('failed', () => m.rooms_pair_failed({ bot: name }))
      .exhaustive();
  }

  if (part?.type === 'data-subagent') {
    return part.data.status === 'answered' ? m.rooms_notice_subagent_answered({ name: part.data.name }) : m.rooms_notice_subagent_failed({ name: part.data.name });
  }

  if (part?.type === 'data-compaction') {
    return m.rooms_notice_compacted();
  }

  return part?.type === 'data-reset' ? m.rooms_notice_reset() : name;
}

export function chatFileType({ name, mediaType }: ChatTypes.ChatFileTypeParams): string {
  const extension = name.split('.').at(-1)?.toLowerCase();

  return mediaType ?? Object.entries(CHAT_FILE_TYPES).find(([type]) => type === extension)?.[1] ?? '';
}

export function chatFileBlob({ uri, name }: Pick<ChatTypes.ChatPicked, 'uri' | 'name'>): Promise<File> {
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
