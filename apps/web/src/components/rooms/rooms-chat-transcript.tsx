import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { RoomsChatHistory } from '@/components/rooms/rooms-chat-history';
import { RoomsChatTranscriptItem } from '@/components/rooms/rooms-chat-transcript-item';
import { RoomsChatUnread } from '@/components/rooms/rooms-chat-unread';
import { MessageScroller, MessageScrollerButton, MessageScrollerViewport } from '@/components/ui/message-scroller';
import { botBubbleStyle } from '@/services/bot/bot.client';
import { CHAT } from '@/services/chat/chat.constants';
import { roomsReactionGroups, roomsTimeLabel } from '@/services/rooms/rooms.client';
import type { MessageScrollerRow } from '@/components/ui/message-scroller';
import type { ChatMessage } from '@/types/chat.types';
import type { RoomsHistoryLoader, RoomsUnread } from '@/types/rooms.types';
import type { Bot, ConversationReaction } from '@openbots/contracts/universal';
import type { ReactNode } from 'react';

interface RoomsChatTranscriptProps {
  bot: Bot
  bots: Bot[]
  messages: ChatMessage[]
  reactions: ConversationReaction[]
  focusedEntryId: number | undefined
  unread?: RoomsUnread
  older: RoomsHistoryLoader
  newer?: RoomsHistoryLoader
  footer?: ReactNode
  onReply: (message: ChatMessage) => void
}

export function RoomsChatTranscript({ bot, bots, messages, reactions, focusedEntryId, unread, older, newer, footer, onReply }: RoomsChatTranscriptProps) {
  const now = new Date();
  const botsById = new Map(bots.map((item) => [item.id, item]));
  const reactionsByEntry = new Map(reactions.map((reaction) => [reaction.entryId, reaction]));
  const focusedId = focusedEntryId === undefined ? undefined : messages.find((message) => message.metadata?.entryIds.includes(focusedEntryId))?.id;
  const firstUnreadId = unread ? messages.find((message) => message.role !== 'user' && (message.metadata?.entryId ?? 0) > unread.throughEntryId)?.id : undefined;

  const rows: MessageScrollerRow[] = [
    ...messages.map((message, index) => ({
      key: message.id,
      node: (
        <>
          {index === 0 ? <RoomsChatHistory direction="older" {...older} /> : null}
          {unread && message.id === firstUnreadId ? <RoomsChatUnread seen={unread.isSeen} onSeen={unread.onSeen} /> : null}
          <RoomsChatTranscriptItem
            bot={bot}
            groups={roomsReactionGroups({ reaction: reactionsByEntry.get(message.metadata?.entryId ?? 0), bots })}
            isFocused={message.id === focusedId}
            isLive={message.id === CHAT.liveMessageId}
            isSending={message.id.startsWith(CHAT.outgoingPrefix)}
            message={message}
            peer={botsById.get(message.metadata?.authorId ?? '')}
            time={message.metadata
              ? roomsTimeLabel({
                createdAt: message.metadata.createdAt,
                previous: messages[index - 1]?.metadata?.createdAt,
                now,
                locale: getLocale(),
              })
              : undefined}
            onReply={onReply}
          />
        </>
      ),
    })),
    newer
      ? { key: 'history-newer', node: <RoomsChatHistory direction="newer" {...newer} /> }
      : { key: 'runs', node: footer },
  ];

  return (
    <MessageScroller className="flex-1" style={botBubbleStyle(bot)}>
      <MessageScrollerViewport
        aria-label={m.rooms_chat_transcript()}
        fade="both"
        focusKey={focusedId}
        positionKey={bot.id}
        rowClassName="max-w-3xl"
        rows={rows}
      />
      <MessageScrollerButton />
    </MessageScroller>
  );
}
