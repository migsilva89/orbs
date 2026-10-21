import { watchConversations } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { experimental_streamedQuery as streamedQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Bot, Plus, QrCode, Star, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { SectionList, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyIcons, EmptyTitle } from '@/components/ui/empty';
import { FloatingBar } from '@/components/ui/floating-bar';
import { GlassButton } from '@/components/ui/glass-button';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent } from '@/components/ui/item';
import { KeyboardSticky } from '@/components/ui/keyboard-sticky';
import { Screen } from '@/components/ui/screen';
import { SearchField } from '@/components/ui/search-field';
import { SectionHeading } from '@/components/ui/section-heading';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import { botHomeSections } from '@/services/bot/bot-home.utils';
import { BotHomeRow } from './bot-home-row';
import type { BotHomeGroup } from '@/types/bot-home.types';
import type { ConnectionContextValue } from '@/types/connection-context.types';
import type { ConversationListItem } from '@openbots/contracts/universal';

export function BotList() {
  const { session } = useConnection();
  return match(session)
    .with(P.nonNullable, (current) => <BotListContent session={current} />)
    .otherwise(() => null);
}

interface BotListContentProps {
  session: NonNullable<ConnectionContextValue['session']>;
}

function BotListContent({ session }: BotListContentProps) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<BotHomeGroup[]>(['hidden']);
  const router = useRouter();

  const query = useQuery({
    ...session.rpc.conversation.list.queryOptions(),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => watchConversations(session.client, signal),
      refetchMode: 'append',
      reducer: (_previous: ConversationListItem[], chats: ConversationListItem[]) => chats,
      initialValue: [],
    }),
  });

  const { featured, sections } = botHomeSections({ chats: query.data ?? [], search });
  const isSearching = search.trim().length > 0;
  const hasMultipleGroups = sections.length > 1;

  const emptyCopy = match(isSearching)
    .with(true, () => ({ title: m.mobile_home_search_empty(), hint: m.mobile_home_search_hint(), action: m.mobile_home_search_clear() }))
    .with(false, () => ({ title: m.mobile_bots_empty(), hint: m.mobile_home_empty_hint(), action: m.mobile_bots_refresh() }))
    .exhaustive();

  const visibleSections = sections.map((section) => ({
    ...section,
    data: match(hasMultipleGroups && collapsed.includes(section.key) && !isSearching).with(true, () => []).with(false, () => section.data).exhaustive(),
  }));

  function handleEmptyAction() {
    match(isSearching)
      .with(true, () => setSearch(''))
      .with(false, () => {
        void query.refetch();
      })
      .exhaustive();
  }

  const emptyContent = match(Boolean(featured) || sections.length > 0)
    .with(true, () => undefined)
    .with(false, () => (
      <Empty>
        <EmptyHeader>
          <EmptyIcons><Icon
            icon={Bot}
            size="lg"
            tone="muted"
          /></EmptyIcons>
          <EmptyTitle>{emptyCopy.title}</EmptyTitle>
          <EmptyDescription>{emptyCopy.hint}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onPress={handleEmptyAction}>{emptyCopy.action}</Button>
        </EmptyContent>
      </Empty>
    ))
    .exhaustive();

  const header = match(featured)
    .with(P.nonNullable, (chat) => (
      <View className="items-center gap-2 py-8">
        <View>
          <Avatar
            avatar={chat.avatar}
            name={chat.name}
            size="featured"
          />
          <Badge
            accessibilityLabel={m.rooms_pinned()}
            className="absolute -right-1 bottom-0"
            variant="pinned"
          >
            <Icon
              fill="currentColor"
              icon={Star}
              size="sm"
            />
          </Badge>
        </View>
        <Text tone="muted" variant="featured-name">{chat.name}</Text>
      </View>
    ))
    .with(undefined, () => undefined)
    .exhaustive();

  return (
    <Screen
      padding="none"
      scroll={false}
    >
      <View className="flex-1">
        {match(query.status)
          .with('pending', () => (
            <View accessibilityLabel={m.mobile_bots_loading()} className="pt-24">
              {[0, 1, 2, 3].map((row) => (
                <Item key={row} size="chat">
                  <Skeleton size="portrait" />
                  <ItemContent>
                    <Skeleton size="title" />
                    <Skeleton size="description" />
                  </ItemContent>
                </Item>
              ))}
            </View>
          ))
          .with('error', () => (
            <View className="gap-4 px-5 pt-24">
              <Alert variant="destructive">
                <AlertTitle>{m.mobile_bots_error_title()}</AlertTitle>
                <AlertDescription>{m.mobile_bots_failed()}</AlertDescription>
              </Alert>
              <Button onPress={() => void query.refetch()}>{m.mobile_retry()}</Button>
            </View>
          ))
          .with('success', () => (
            <SectionList
              contentContainerClassName="grow pt-16 pb-32"
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
              keyExtractor={(chat) => chat.botId}
              ListEmptyComponent={emptyContent}
              ListHeaderComponent={header}
              renderItem={({ item }) => <BotHomeRow chat={item} />}
              renderSectionHeader={({ section }) => match(hasMultipleGroups).with(true, () => (
                <SectionHeading
                  disabled={isSearching}
                  expanded={!collapsed.includes(section.key) || isSearching}
                  label={section.title}
                  onPress={() => setCollapsed((previous) => match(previous.includes(section.key))
                    .with(true, () => previous.filter((key) => key !== section.key))
                    .with(false, () => [...previous, section.key])
                    .exhaustive())}
                />
              )).with(false, () => null).exhaustive()}
              sections={visibleSections}
              stickySectionHeadersEnabled={false}
            />
          ))
          .exhaustive()}
        <FloatingBar edge="top">
          <GlassButton accessibilityLabel={m.settings_title()} onPress={() => router.push('/settings')}>
            <Icon icon={UserRound} size="action" />
          </GlassButton>
          <GlassButton accessibilityLabel={m.rooms_bot_title()} onPress={() => router.push('/bots/create')}>
            <Icon icon={Plus} size="action" />
          </GlassButton>
        </FloatingBar>
        <KeyboardSticky>
          <FloatingBar edge="bottom">
            <GlassButton
              disabled
              accessibilityHint={m.mobile_home_unavailable()}
              accessibilityLabel={m.mobile_home_pair()}
            >
              <Icon icon={QrCode} size="action" />
            </GlassButton>
            <SearchField
              accessibilityLabel={m.rooms_search()}
              className="flex-1"
              placeholder={m.mobile_home_search()}
              testID="bots-search"
              value={search}
              onChangeText={setSearch}
            />
          </FloatingBar>
        </KeyboardSticky>
      </View>
    </Screen>
  );
}
