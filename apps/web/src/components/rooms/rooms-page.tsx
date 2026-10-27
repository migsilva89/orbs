import { MessageScrollerProvider } from '@repo/ui/message-scroller';
import { useSuspenseQuery } from '@tanstack/react-query';
import { match, P } from 'ts-pattern';
import { RoomsChat } from '@/components/rooms/rooms-chat';
import { RoomsStart } from '@/components/rooms/rooms-start';
import { rpc } from '@/services/rpc/rpc.client';

interface RoomsPageProps {
  botId?: string
}

export function RoomsPage({ botId }: RoomsPageProps) {
  const { data: chats } = useSuspenseQuery(rpc.conversation.list.queryOptions());
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const chat = chats.find((item) => item.botId === botId);
  const bot = bots.find((item) => item.id === botId);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {match({ chat, bot })
        .with({ chat: P.nonNullable, bot: P.nonNullable }, (open) => (
          <MessageScrollerProvider key={open.bot.id}>
            <RoomsChat
              bot={open.bot}
              bots={bots}
              chat={open.chat}
            />
          </MessageScrollerProvider>
        ))
        .otherwise(() => <RoomsStart />)}
    </div>
  );
}
