import { useChatAround } from '@repo/client/react';
import { useEffect } from 'react';
import { RoomsChatTranscript } from '@/components/rooms/rooms-chat-transcript';
import type { ChatMessage } from '@repo/client/client';
import type { Bot, ConversationView } from '@repo/contracts/universal';

interface RoomsChatAroundProps {
  bot: Bot
  bots: Bot[]
  view: ConversationView
  entryId: number
  onLatest: () => void
  onReply: (message: ChatMessage) => void
}

export function RoomsChatAround({ bot, bots, view, entryId, onLatest, onReply }: RoomsChatAroundProps) {
  const around = useChatAround({
    bot,
    bots,
    view,
    entryId,
  });

  const { isLatest } = around;

  useEffect(() => {
    if (isLatest) {
      onLatest();
    }
  }, [isLatest, onLatest]);

  return (
    <RoomsChatTranscript
      bot={bot}
      bots={bots}
      focusedEntryId={entryId}
      messages={around.messages}
      newer={around.newer}
      older={around.older}
      reactions={around.reactions}
      onReply={onReply}
    />
  );
}
