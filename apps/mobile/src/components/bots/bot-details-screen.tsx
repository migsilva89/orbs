import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { BotActionsMenu } from '@/components/bots/bot-actions-menu';
import { BotDetailsFacts } from '@/components/bots/bot-details-facts';
import { BotDetailsMedia } from '@/components/bots/bot-details-media';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { BotDetailsSettings } from '@/components/bots/bot-details-settings';
import { BotLoadState } from '@/components/bots/bot-load-state';
import { RoutinesList } from '@/components/routines/routines-list';
import { TodosList } from '@/components/todos/todos-list';
import { Avatar } from '@/components/ui/avatar';
import { Tabs } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';
import { useChatReturn } from '@/hooks/use-chat-return';
import { useConnection } from '@/hooks/use-connection';
import type { BotDetailsTab } from '@/types/bot-details.types';
import type { RpcSession } from '@/types/rpc.types';
import type { Bot, ConversationListItem } from '@repo/contracts/universal';

interface BotDetailsScreenProps {
  botId: string;
}

export function BotDetailsScreen({ botId }: BotDetailsScreenProps) {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <BotDetailsScreenLoader botId={botId} session={current} />)
    .otherwise(() => null);
}

interface BotDetailsScreenLoaderProps {
  session: RpcSession;
  botId: string;
}

function BotDetailsScreenLoader({ session, botId }: BotDetailsScreenLoaderProps) {
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const chats = useQuery(session.rpc.conversation.list.queryOptions());

  return match({ bot: bots.data?.find((item) => item.id === botId), chat: chats.data?.find((item) => item.botId === botId) })
    .with({ bot: P.nonNullable, chat: P.nonNullable }, ({ bot, chat }) => (
      <BotDetailsScreenContent
        bot={bot}
        chat={chat}
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
}

function BotDetailsScreenContent({ session, bot, chat }: BotDetailsScreenContentProps) {
  const returnToChat = useChatReturn();
  const [tab, setTab] = useState<BotDetailsTab>('details');
  const prefill = (text: string) => returnToChat({ botId: bot.id, prefill: text });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-4 px-4 pt-4 pb-12"
      contentInsetAdjustmentBehavior="automatic"
    >
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
      <Tabs
        options={[{ value: 'details', label: m.rooms_tab_details() }, { value: 'media', label: m.rooms_tab_media() }]}
        value={tab}
        onValueChange={setTab}
      />
      {match(tab)
        .with('details', () => (
          <View className="gap-4">
            <BotDetailsSettings
              bot={bot}
              chat={chat}
              session={session}
            />
            <BotDetailsSection title={m.rooms_todos()}>
              <TodosList
                bot={bot}
                session={session}
                onPrefill={prefill}
              />
            </BotDetailsSection>
            <BotDetailsSection title={m.rooms_routines()}>
              <RoutinesList
                bot={bot}
                session={session}
                onPrefill={prefill}
              />
            </BotDetailsSection>
            <BotDetailsFacts bot={bot} chat={chat} />
          </View>
        ))
        .with('media', () => <BotDetailsMedia botId={bot.id} session={session} />)
        .exhaustive()}
    </ScrollView>
  );
}
