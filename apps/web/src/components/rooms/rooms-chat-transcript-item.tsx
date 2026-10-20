import { match } from 'ts-pattern';
import { RoomsChatMessage } from '@/components/rooms/rooms-chat-message';
import { RoomsChatNotice } from '@/components/rooms/rooms-chat-notice';
import { RoomsChatReactions } from '@/components/rooms/rooms-chat-reactions';
import { RoomsChatReply } from '@/components/rooms/rooms-chat-reply';
import { MessageScrollerItem } from '@/components/ui/message-scroller';
import type { ChatMessage } from '@/types/chat.types';
import type { RoomsReactionGroup } from '@/types/rooms.types';
import type { Bot } from '@openbots/contracts/universal';

interface RoomsChatTranscriptItemProps {
  message: ChatMessage
  bot: Bot
  peer: Bot | undefined
  groups: RoomsReactionGroup[]
  time: string | undefined
  isFocused: boolean
  isLive: boolean
  isSending: boolean
  onReply: (message: ChatMessage) => void
}

export function RoomsChatTranscriptItem({ message, bot, peer, groups, time, isFocused, isLive, isSending, onReply }: RoomsChatTranscriptItemProps) {
  return (
    <MessageScrollerItem className={isSending ? 'opacity-60' : undefined} variant={isFocused ? 'highlight' : 'default'}>
      {time ? <p className="my-3 zoom-[0.8] text-center text-xs text-muted-foreground">{time}</p> : null}
      {match(message.role)
        .with('system', () => (
          <RoomsChatNotice
            bot={bot}
            message={message}
            peer={peer}
          />
        ))
        .with('assistant', () => (
          <RoomsChatReply
            bot={bot}
            botId={bot.id}
            groups={groups}
            hasActions={!isLive}
            live={isLive}
            message={message}
            name={message.metadata?.authorName ?? bot.name}
            onReply={() => onReply(message)}
          />
        ))
        .otherwise(() => (
          <>
            <RoomsChatMessage
              botId={bot.id}
              hasActions={!isSending}
              message={message}
              name={message.metadata?.authorName ?? ''}
              onReply={() => onReply(message)}
            />
            <RoomsChatReactions align="end" groups={groups} />
          </>
        ))}
    </MessageScrollerItem>
  );
}
