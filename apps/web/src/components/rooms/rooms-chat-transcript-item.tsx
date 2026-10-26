import { match } from 'ts-pattern';
import { RoomsChatMessage } from '@/components/rooms/rooms-chat-message';
import { RoomsChatNotice } from '@/components/rooms/rooms-chat-notice';
import { RoomsChatReactions } from '@/components/rooms/rooms-chat-reactions';
import { RoomsChatReply } from '@/components/rooms/rooms-chat-reply';
import { MessageScrollerItem } from '@/components/ui/message-scroller';
import type { ChatMessage, RoomsReactionGroup } from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';

interface RoomsChatTranscriptItemProps {
  message: ChatMessage
  bot: Bot
  groups: RoomsReactionGroup[]
  time: string | undefined
  isFocused: boolean
  isLive: boolean
  isSending: boolean
  isCollapsible: boolean
  isReadOnly: boolean
  onReply: (message: ChatMessage) => void
}

export function RoomsChatTranscriptItem({
  message,
  bot,
  groups,
  time,
  isFocused,
  isLive,
  isSending,
  isCollapsible,
  isReadOnly,
  onReply,
}: RoomsChatTranscriptItemProps) {
  return (
    <MessageScrollerItem className={isSending ? 'opacity-60' : undefined} variant={isFocused ? 'highlight' : 'default'}>
      {time ? <p className="my-3 zoom-[0.8] text-center text-xs text-muted-foreground">{time}</p> : null}
      {match(message.role)
        .with('system', () => <RoomsChatNotice message={message} />)
        .with('assistant', () => (
          <RoomsChatReply
            bot={bot}
            botId={bot.id}
            groups={groups}
            hasActions={!isLive && !isReadOnly}
            isCollapsible={isCollapsible}
            live={isLive}
            message={message}
            name={message.metadata?.authorName ?? bot.name}
            onReply={() => onReply(message)}
          />
        ))
        .otherwise(() => (
          <RoomsChatMessage
            botId={bot.id}
            hasActions={!isSending && !isReadOnly}
            isCollapsible={isCollapsible}
            message={message}
            name={message.metadata?.authorName ?? ''}
            reactions={groups.length > 0 ? <RoomsChatReactions groups={groups} /> : undefined}
            onReply={() => onReply(message)}
          />
        ))}
    </MessageScrollerItem>
  );
}
