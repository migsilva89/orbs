import { match } from 'ts-pattern';
import { Avatar } from '@/components/ui/avatar';
import { Markdown } from '@/components/ui/markdown';
import { Message, MessageBubble, MessageName } from '@/components/ui/message';
import { Text } from '@/components/ui/text';
import { chatMessageSegments } from '@/services/chat/chat.utils';
import { ChatArtifact } from './chat-artifact';
import { ChatHtml } from './chat-html';
import { ChatNotice } from './chat-notice';
import { ChatReactions } from './chat-reactions';
import { ChatReasoning } from './chat-reasoning';
import { ChatTools } from './chat-tools';
import type { ChatMessagePart } from '@/types/chat.types';
import type { RpcSession } from '@/types/rpc.types';
import type { BotBubble, ChatMessage as ChatMessageItem, RoomsReactionGroup } from '@openbots/client/client';
import type { Bot } from '@openbots/contracts/universal';

interface ChatMessageProps {
  session: RpcSession;
  message: ChatMessageItem;
  bot: Bot;
  bots: Bot[];
  bubble?: BotBubble;
  time?: string;
  reactions: RoomsReactionGroup[];
  isLive: boolean;
  isSending: boolean;
  reacting?: boolean;
  reactionFailed?: boolean;
  onReact: (emoji: string) => void;
  onLongPress: () => void;
}

export function ChatMessage({
  session,
  message,
  bot,
  bots,
  bubble,
  time,
  reactions,
  isLive,
  isSending,
  reacting,
  reactionFailed,
  onReact,
  onLongPress,
}: ChatMessageProps) {
  const from = match(message.role).with('user', () => 'user' as const).otherwise(() => 'assistant' as const);
  const entryId = message.metadata?.entryId ?? 0;
  const canReact = from === 'assistant' && entryId > 0;
  const name = message.metadata?.authorName ?? bot.name;
  const segments = chatMessageSegments(message);
  const bubbleSegments = segments.filter((segment) => segment.kind === 'bubbles');
  const firstBubbles = bubbleSegments.at(0);
  const lastBubbles = bubbleSegments.at(-1);

  const timeLabel = time ? (
    <Text
      className="my-3"
      tone="muted"
      variant="message-time"
    >
      {time}
    </Text>
  ) : null;

  if (message.role === 'system') {
    return (
      <>
        {timeLabel}
        <ChatNotice
          bot={bot}
          message={message}
          peer={bots.find((item) => item.id === message.metadata?.authorId)}
        />
      </>
    );
  }

  if (segments.length === 0) {
    return null;
  }

  const avatar = (
    <Avatar
      avatar={bot.avatar}
      name={name}
      size="sm"
    />
  );

  function renderPart(part: ChatMessagePart, isLast: boolean) {
    return match(part)
      .with({ kind: 'markdown' }, (text) => (
        <MessageBubble
          bubble={bubble}
          from={from}
          key={text.key}
          tail={isLast}
        >
          <Markdown isStreaming={text.isStreaming}>{text.text}</Markdown>
        </MessageBubble>
      ))
      .with({ kind: 'reasoning' }, (reasoning) => (
        <ChatReasoning
          isStreaming={isLive ? reasoning.isStreaming : false}
          key={reasoning.key}
          name={name}
          text={reasoning.text}
        />
      ))
      .with({ kind: 'html' }, (html) => <ChatHtml html={html.text} key={html.key} />)
      .with({ kind: 'artifact' }, (artifact) => (
        <ChatArtifact
          artifact={artifact.artifact}
          key={artifact.key}
          session={session}
        />
      ))
      .with({ kind: 'failure' }, (failure) => (
        <Text
          className="mx-4"
          key={failure.key}
          tone="destructive"
          variant="small"
        >
          {failure.text}
        </Text>
      ))
      .exhaustive();
  }

  return (
    <>
      {timeLabel}
      {segments.map((segment) => match(segment)
        .with({ kind: 'tools' }, (tools) => (
          <ChatTools
            bots={bots}
            key={tools.key}
            parts={tools.parts}
          />
        ))
        .with({ kind: 'bubbles' }, (bubbles) => (
          <Message
            avatar={bubbles === lastBubbles ? avatar : null}
            className={isSending ? 'opacity-60' : undefined}
            from={from}
            key={bubbles.key}
            onLongPress={isLive || isSending ? undefined : onLongPress}
          >
            {from === 'assistant' && bubbles === firstBubbles ? <MessageName>{name}</MessageName> : null}
            {bubbles.parts.map((part) => renderPart(part, bubbles === lastBubbles && part === bubbles.parts.at(-1)))}
          </Message>
        ))
        .exhaustive())}
      <ChatReactions
        align={from === 'user' ? 'end' : 'start'}
        disabled={reacting}
        failed={reactionFailed}
        groups={reactions}
        onToggle={canReact ? onReact : undefined}
      />
    </>
  );
}
