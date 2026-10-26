import { botUsageLabel, htmlReplySegments, toolBlocks } from '@repo/client/client';
import { getLocale, m } from '@repo/i18n/client';
import { match } from 'ts-pattern';
import type * as ChatTypes from '@/types/chat.types';
import type { ChatMessage } from '@repo/client/client';

export function chatMessageDetails(message: ChatMessage): string[] {
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
  const sent = message.metadata ? [m.rooms_chat_sent({ date: date.format(new Date(message.metadata.createdAt)) })] : [];
  const usage = message.role === 'assistant' && message.metadata?.usage ? [botUsageLabel(message.metadata.usage)] : [];

  return [...sent, ...usage];
}

export function chatMessageSegments(message: ChatMessage, hideVerbose: boolean): ChatTypes.ChatMessageSegment[] {
  const isReply = message.role !== 'user';
  const files = message.parts.filter((part) => part.type === 'file');
  const segments: ChatTypes.ChatMessageSegment[] = files.length > 0 ? [{ key: 'files', kind: 'bubbles', parts: [{ key: 'files', kind: 'files', files }] }] : [];

  for (const block of toolBlocks({ parts: message.parts, hideVerbose })) {
    const tools = match(block)
      .with({ kind: 'tools' }, ({ parts }) => parts)
      .otherwise(() => undefined);

    if (block.kind === 'events') {
      segments.push({
        key: `events-${block.index}`,
        kind: 'events',
        events: block.events,
      });
      continue;
    }

    if (block.kind === 'subagent') {
      segments.push({
        key: `subagent-${block.index}`,
        kind: 'subagent',
        part: block.part,
        subagent: block.subagent,
      });
      continue;
    }

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

export function chatNoticeTitle(message: ChatMessage): string {
  const name = message.metadata?.authorName ?? '';
  const part = message.parts.at(0);

  if (part?.type === 'data-subagent') {
    return part.data.status === 'answered' ? m.rooms_notice_subagent_answered({ name: part.data.name }) : m.rooms_notice_subagent_failed({ name: part.data.name });
  }

  if (part?.type === 'data-ownerNote') {
    return part.data.peerName ? m.rooms_notice_owner_note({ name: part.data.peerName }) : m.rooms_notice_owner_note_unknown();
  }

  if (part?.type === 'data-routineRun') {
    return part.data.name ? m.rooms_notice_routine_run({ name: part.data.name }) : m.rooms_notice_routine_run_unnamed();
  }

  if (part?.type === 'data-compaction') {
    return m.rooms_notice_compacted();
  }

  return part?.type === 'data-reset' ? m.rooms_notice_reset() : name;
}

