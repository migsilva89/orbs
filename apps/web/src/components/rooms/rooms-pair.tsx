import { CHAT, chatPairMessages } from '@openbots/client/client';
import { chatViewOptions, useChatRoom } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { RoomsChatRuns } from '@/components/rooms/rooms-chat-runs';
import { RoomsChatTranscript } from '@/components/rooms/rooms-chat-transcript';
import { RoomsPairPill } from '@/components/rooms/rooms-pair-pill';
import { Button } from '@/components/ui/button';
import { MessageScrollerProvider } from '@/components/ui/message-scroller';
import { roomsLink } from '@/services/rooms/rooms.client';
import { rpc } from '@/services/rpc/rpc.client';
import { RPC_CONTEXT } from '@/services/rpc/rpc.constants';
import type { Bot, ConversationView } from '@openbots/contracts/universal';

interface RoomsPairViewProps {
  sender: Bot
  peer: Bot
  bots: Bot[]
  view: ConversationView
}

function RoomsPairView({ sender, peer, bots, view }: RoomsPairViewProps) {
  const room = useChatRoom({
    bot: peer,
    bots,
    view,
    outgoing: [],
  });

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-12 pt-3 *:pointer-events-auto">
        <RoomsPairPill peer={peer} sender={sender} />
      </div>
      <RoomsChatTranscript
        isReadOnly
        bot={peer}
        bots={bots}
        focusedEntryId={undefined}
        footer={(
          <RoomsChatRuns
            activity={room.activity}
            approvals={room.approvals}
            bot={peer}
            draft={room.messages.find((message) => message.id === CHAT.liveMessageId)}
            failure={room.failure}
            questions={room.questions}
          />
        )}
        messages={chatPairMessages(room.messages, sender.id)}
        older={room.older}
        reactions={room.reactions}
        onReply={() => undefined}
      />
      <div className="flex justify-center p-4">
        <Button asChild variant="outline">
          <Link {...roomsLink(sender)}>{m.rooms_pair_close()}</Link>
        </Button>
      </div>
    </div>
  );
}

interface RoomsPairProps {
  sender: Bot
  peer: Bot
  conversationId: number
}

export function RoomsPair({ sender, peer, conversationId }: RoomsPairProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const { data: view } = useQuery(chatViewOptions(RPC_CONTEXT, { botId: peer.id, conversationId }));

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {view ? (
        <MessageScrollerProvider>
          <RoomsPairView
            bots={bots}
            peer={peer}
            sender={sender}
            view={view}
          />
        </MessageScrollerProvider>
      ) : null}
    </div>
  );
}
