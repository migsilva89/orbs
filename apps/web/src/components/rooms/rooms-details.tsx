import { m } from '@repo/i18n/client';
import { getLocale } from '@repo/i18n/runtime';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useHydrated, useMatch } from '@tanstack/react-router';
import { useState } from 'react';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { RoomsDetailsBot } from '@/components/rooms/rooms-details-bot';
import { RoomsDetailsMedia } from '@/components/rooms/rooms-details-media';
import { RoomsDetailsSection } from '@/components/rooms/rooms-details-section';
import { RoomsSettingsMenu } from '@/components/rooms/rooms-settings-menu';
import { RoutinesList } from '@/components/routines/routines-list';
import { TodosList } from '@/components/todos/todos-list';
import { Button } from '@/components/ui/button';
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle, ItemValue } from '@/components/ui/item';
import * as Sidebar from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { rpc } from '@/services/rpc/rpc.client';
import IconPanelRight from '~icons/lucide/panel-right';
import type { RoomsChat } from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';

export function RoomsDetails() {
  const direct = useMatch({ from: '/_chat/rooms/direct/$handle', shouldThrow: false });
  const [tabAcrossChats, setTabAcrossChats] = useState('details');
  const botId = direct?.loaderData?.botId;

  return botId ? (
    <RoomsDetailsPanel
      botId={botId}
      key={botId}
      tab={tabAcrossChats}
      onTabChange={setTabAcrossChats}
    />
  ) : null;
}

interface RoomsDetailsPanelProps {
  botId: string
  tab: string
  onTabChange: (tab: string) => void
}

function RoomsDetailsPanel({ botId, tab, onTabChange }: RoomsDetailsPanelProps) {
  const { data: bots } = useSuspenseQuery(rpc.bots.list.queryOptions());
  const { data: chats } = useSuspenseQuery(rpc.conversation.list.queryOptions());
  const { isMobile, toggleSidebar } = Sidebar.useSidebar();
  const bot = bots.find((item) => item.id === botId);
  const chat = chats.find((item) => item.botId === botId);

  if (!bot || !chat) {
    return null;
  }

  return (
    <Sidebar.Sidebar side="right" variant="panel">
      <div className="cursor-default electrobun-webkit-app-region-drag">
        <Sidebar.SidebarHeader className="items-center gap-1 text-center">
          {isMobile ? null : (
            <div className="self-end electrobun-webkit-app-region-no-drag">
              <Button
                aria-label={m.rooms_details_close()}
                size="icon-sm"
                title={m.rooms_details_close()}
                variant="outline"
                onClick={toggleSidebar}
              >
                <IconPanelRight className="size-4" />
              </Button>
            </div>
          )}
          <div className="contents electrobun-webkit-app-region-no-drag">
            <RoomsSettingsMenu align="center" chat={chat}>
              <span className="mb-1">
                <BotAvatar bot={bot} size={56} />
              </span>
            </RoomsSettingsMenu>
            <h2 className="max-w-full truncate font-medium">{bot.name}</h2>
            <p className="max-w-full truncate text-xs text-muted-foreground">@{bot.handle}</p>
          </div>
        </Sidebar.SidebarHeader>
      </div>
      <Tabs
        className="min-h-0 flex-1 gap-0"
        value={tab}
        onValueChange={onTabChange}
      >
        <TabsList className="mx-auto mb-2" variant="muted">
          <TabsTrigger value="details" variant="muted">
            {m.rooms_tab_details()}
          </TabsTrigger>
          <TabsTrigger value="media" variant="muted">
            {m.rooms_tab_media()}
          </TabsTrigger>
        </TabsList>
        <Sidebar.SidebarContent>
          <TabsContent className="flex flex-col gap-4 px-4 py-2" value="details">
            <RoomsDetailsBot bot={bot} chat={chat} />
            <RoomsDetailsSection title={m.rooms_todos()}>
              <TodosList bot={bot} handle={bot.handle} />
            </RoomsDetailsSection>
            <RoomsDetailsSection title={m.rooms_routines()}>
              <RoutinesList bot={bot} />
            </RoomsDetailsSection>
            <RoomsDetailsFacts bot={bot} chat={chat} />
          </TabsContent>
          <TabsContent value="media">
            <RoomsDetailsMedia botId={bot.id} />
          </TabsContent>
        </Sidebar.SidebarContent>
      </Tabs>
      <Sidebar.SidebarRail />
    </Sidebar.Sidebar>
  );
}

interface RoomsDetailsFactsProps {
  bot: Bot
  chat: RoomsChat
}

function RoomsDetailsFacts({ bot, chat }: RoomsDetailsFactsProps) {
  const hydrated = useHydrated();
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium', timeStyle: 'short' });
  const lastActivity = chat.lastMessage && hydrated ? date.format(new Date(chat.lastMessage.createdAt)) : '';

  const facts = [
    { label: m.rooms_last_activity(), value: chat.lastMessage ? lastActivity : m.rooms_last_activity_none() },
    { label: m.rooms_details_created(), value: hydrated ? date.format(new Date(bot.createdAt)) : '' },
  ];

  return (
    <RoomsDetailsSection title={m.rooms_details_general()}>
      <ItemGroup variant="outline">
        {facts.map((fact) => (
          <Item key={fact.label} size="sm">
            <ItemContent>
              <ItemTitle>{fact.label}</ItemTitle>
            </ItemContent>
            <ItemActions className="min-w-0">
              <ItemValue>{fact.value}</ItemValue>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </RoomsDetailsSection>
  );
}
