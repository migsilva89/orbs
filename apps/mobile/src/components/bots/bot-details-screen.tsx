import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { CalendarClock, ChevronRight, Images, ListTodo } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { BotActionsMenu } from '@/components/bots/bot-actions-menu';
import { BotDetailsFacts } from '@/components/bots/bot-details-facts';
import { BotDetailsMedia } from '@/components/bots/bot-details-media';
import { BotDetailsSettings } from '@/components/bots/bot-details-settings';
import { BotLoadState } from '@/components/bots/bot-load-state';
import { RoutinesList } from '@/components/routines/routines-list';
import { TodosList } from '@/components/todos/todos-list';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { ItemButton, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { Text } from '@/components/ui/text';
import { useChatReturn } from '@/hooks/use-chat-return';
import { useConnection } from '@/hooks/use-connection';
import type { BotDetailsPage } from '@/types/bot-details.types';
import type { RpcSession } from '@/types/rpc.types';
import type { Bot, ConversationListItem } from '@repo/contracts/universal';

interface BotDetailsScreenProps {
  botId: string;
  page?: BotDetailsPage;
}

export function BotDetailsScreen({ botId, page }: BotDetailsScreenProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => (
      <BotDetailsScreenLoader
        botId={botId}
        page={page}
        session={current}
      />
    ))
    .otherwise(() => null);
}

interface BotDetailsScreenLoaderProps {
  session: RpcSession;
  botId: string;
  page?: BotDetailsPage;
}

function BotDetailsScreenLoader({ session, botId, page }: BotDetailsScreenLoaderProps) {
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const chats = useQuery(session.rpc.conversation.list.queryOptions());

  return match({ bot: bots.data?.find((item) => item.id === botId), chat: chats.data?.find((item) => item.botId === botId) })
    .with({ bot: P.nonNullable, chat: P.nonNullable }, ({ bot, chat }) => (
      <BotDetailsScreenContent
        bot={bot}
        chat={chat}
        page={page}
        session={session}
      />
    ))
    .otherwise(() => (
      <BotLoadState
        isError={[bots, chats].some((query) => query.isError)}
        isMissing={[bots, chats].every((query) => query.isSuccess)}
        onRetry={() => void Promise.all([
          bots.refetch(),
          chats.refetch(),
        ])}
      />
    ));
}

interface BotDetailsScreenContentProps {
  session: RpcSession;
  bot: Bot;
  chat: ConversationListItem;
  page?: BotDetailsPage;
}

function BotDetailsScreenContent({ session, bot, chat, page }: BotDetailsScreenContentProps) {
  const returnToChat = useChatReturn();
  const prefill = (text: string) => returnToChat({ botId: bot.id, prefill: text });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-4 pt-4 pb-12"
      contentInsetAdjustmentBehavior="automatic"
    >
      {match(page)
        .with('todos', () => (
          <TodosList
            bot={bot}
            session={session}
            onPrefill={prefill}
          />
        ))
        .with('routines', () => (
          <RoutinesList
            bot={bot}
            session={session}
            onPrefill={prefill}
          />
        ))
        .with('media', () => <BotDetailsMedia botId={bot.id} session={session} />)
        .with(undefined, () => (
          <>
            <View className="items-center gap-1">
              <BotActionsMenu botId={bot.id} mode="press">
                <View
                  accessibilityHint={m.rooms_actions()}
                  accessibilityLabel={bot.name}
                  className="mb-1"
                >
                  <Avatar avatar={bot.avatar} name={bot.name} />
                </View>
              </BotActionsMenu>
              <Text numberOfLines={1} variant="label">{bot.name}</Text>
              <Text
                numberOfLines={1}
                tone="muted"
                variant="small"
              >{`@${bot.handle}`}</Text>
            </View>
            <BotDetailsSettings
              bot={bot}
              chat={chat}
              session={session}
            />
            <BotDetailsScreenPages botId={bot.id} />
            <BotDetailsFacts bot={bot} chat={chat} />
          </>
        ))
        .exhaustive()}
    </ScrollView>
  );
}

interface BotDetailsScreenPagesProps {
  botId: string;
}

function BotDetailsScreenPages({ botId }: BotDetailsScreenPagesProps) {
  const router = useRouter();

  const pages = [
    { pathname: '/bots/[botId]/todos', title: m.rooms_todos(), icon: ListTodo },
    { pathname: '/bots/[botId]/routines', title: m.rooms_routines(), icon: CalendarClock },
    { pathname: '/bots/[botId]/media', title: m.rooms_tab_media(), icon: Images },
  ] as const;

  return (
    <ItemGroup>
      {pages.map((item) => (
        <ItemButton
          accessibilityLabel={item.title}
          key={item.pathname}
          size="sm"
          onPress={() => router.push({ pathname: item.pathname, params: { botId } })}
        >
          <ItemMedia>
            <Icon icon={item.icon} tone="muted" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{item.title}</ItemTitle>
          </ItemContent>
          <Icon
            icon={ChevronRight}
            size="sm"
            tone="muted"
          />
        </ItemButton>
      ))}
    </ItemGroup>
  );
}
