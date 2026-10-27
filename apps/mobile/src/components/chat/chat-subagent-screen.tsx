import { botBubble, roomsMessageText } from '@repo/client/client';
import { chatQueries, useChatPendingSync, useChatRoom } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { match, P } from 'ts-pattern';
import { MessageList } from '@/components/ui/message-list';
import { Screen } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import { CHAT_PANE } from '@/services/chat/chat.constants';
import { ChatMessage } from './chat-message';
import { ChatPaneClose, ChatPaneHeader, ChatPaneTitle } from './chat-pane';
import { ChatRuns } from './chat-runs';
import type { RpcSession } from '@/types/rpc.types';
import type { Bot, ConversationView } from '@repo/contracts/universal';

interface ChatSubagentScreenProps {
  botId: string;
  conversationId: number;
  name: string;
  task: string;
}

export function ChatSubagentScreen(props: ChatSubagentScreenProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <ChatSubagentScreenContent {...props} session={current} />)
    .otherwise(() => null);
}

interface ChatSubagentScreenContentProps extends ChatSubagentScreenProps {
  session: RpcSession;
}

function ChatSubagentScreenContent({ session, botId, conversationId, name, task }: ChatSubagentScreenContentProps) {
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const view = useQuery(chatQueries.view(session, { botId, conversationId }));

  return (
    <Screen padding="none" scroll={false}>
      {match({
        bot: bots.data?.find((item) => item.id === botId),
        view: view.data,
        isError: bots.isError || view.isError,
      })
        .with({ bot: P.nonNullable, view: P.nonNullable }, (ready) => (
          <ChatSubagentScreenView
            bot={ready.bot}
            bots={bots.data ?? []}
            session={session}
            task={task}
            view={ready.view}
          />
        ))
        .otherwise(({ isError }) => (
          <View className="flex-1 items-center justify-center">
            <Text tone={isError ? 'destructive' : 'muted'}>{isError ? m.mobile_chat_error_title() : m.mobile_chat_loading()}</Text>
          </View>
        ))}
      <ChatPaneHeader>
        <ChatPaneTitle>{name}</ChatPaneTitle>
      </ChatPaneHeader>
      <ChatPaneClose />
    </Screen>
  );
}

interface ChatSubagentScreenViewProps {
  session: RpcSession;
  bot: Bot;
  bots: Bot[];
  view: ConversationView;
  task: string;
}

function ChatSubagentScreenView({ session, bot, bots, view, task }: ChatSubagentScreenViewProps) {
  const insets = useSafeAreaInsets();
  const bottomInset = useSharedValue(insets.bottom + CHAT_PANE.barHeight);
  useChatPendingSync();

  const room = useChatRoom({
    bot,
    bots,
    view,
    outgoing: [],
  });

  const replies = room.messages.filter((message) => message.role === 'assistant' && roomsMessageText(message));

  return (
    <MessageList
      composerInset={bottomInset}
      data={replies}
      footer={(
        <ChatRuns
          activity={room.activity}
          approvals={room.approvals}
          bot={bot}
          failure={room.failure}
          questions={room.questions}
        />
      )}
      header={(
        <View className="mx-3 mb-2 gap-1 rounded-2xl border border-border p-3">
          <Text tone="muted" variant="small">{m.rooms_subagent_task({ bot: bot.name })}</Text>
          <Text variant="body">{task}</Text>
        </View>
      )}
      keyExtractor={(message) => message.id}
      renderItem={(message) => (
        <ChatMessage
          bot={bot}
          bots={bots}
          bubble={botBubble(bot)}
          isLive={false}
          isSending={false}
          message={message}
          reactions={[]}
          session={session}
          onLongPress={() => undefined}
          onReact={() => undefined}
        />
      )}
    />
  );
}
