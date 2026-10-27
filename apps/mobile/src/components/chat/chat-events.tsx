import { toolPeers, toolRunning } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AlarmClock, AlarmClockCheck, AlarmClockOff, AlarmClockPlus, CircleCheck, ListPlus, ListTodo, ListX } from 'lucide-react-native';
import { Fragment } from 'react';
import { Pressable } from 'react-native';
import { match } from 'ts-pattern';
import { BotMention } from '@/components/bots/bot-mention';
import { Avatar } from '@/components/ui/avatar';
import { EventLabel, EventLine, EventList, EventName } from '@/components/ui/event';
import { Icon } from '@/components/ui/icon';
import { Menu } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import type { EventStatus } from '@/components/ui/event';
import type { RpcSession } from '@/types/rpc.types';
import type * as ClientTypes from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

const CHAT_EVENTS_ICONS = {
  'alarm-clock-plus': AlarmClockPlus,
  'alarm-clock': AlarmClock,
  'alarm-clock-check': AlarmClockCheck,
  'alarm-clock-off': AlarmClockOff,
  'list-plus': ListPlus,
  'list-todo': ListTodo,
  'circle-check': CircleCheck,
  'list-x': ListX,
} satisfies Record<ClientTypes.ToolEventIcon, LucideIcon>;

interface ChatEventsLineProps {
  label: string;
  isDeleted?: boolean;
  status?: EventStatus;
  children: ReactNode;
}

function ChatEventsLine({ label, isDeleted = false, status, children }: ChatEventsLineProps) {
  return (
    <EventLine status={status}>
      <EventLabel>{label}</EventLabel>
      {children}
      {isDeleted ? <EventLabel>{m.rooms_event_deleted()}</EventLabel> : null}
    </EventLine>
  );
}

interface ChatEventsLinkProps {
  onPress?: () => void;
  children: ReactNode;
}

function ChatEventsLink({ onPress, children }: ChatEventsLinkProps) {
  return onPress ? (
    <Pressable
      accessibilityRole="link"
      className="min-w-0 shrink"
      onPress={onPress}
    >
      {children}
    </Pressable>
  ) : children;
}

interface ChatEventsPeersProps {
  parts: ClientTypes.ToolPart[];
  bots: Bot[];
  senderId: string;
}

function ChatEventsPeers({ parts, bots, senderId }: ChatEventsPeersProps) {
  const router = useRouter();
  const peers = toolPeers(parts, bots);

  const stack = peers.slice(0, 3).map(({ peer }) => (
    <Avatar
      avatar={peer.avatar}
      key={peer.id}
      name={peer.name}
      size="xs"
    />
  ));

  function openPair({ peer, conversationId }: ClientTypes.ToolPeer) {
    if (conversationId !== undefined) {
      router.push({ pathname: '/chat/[botId]/with/[peerId]', params: { botId: senderId, peerId: peer.id, conversationId } });
    }
  }

  return (
    <ChatEventsLine label={parts.length > 1 ? m.rooms_pair_messages({ count: parts.length }) : m.rooms_pair_messaged()} status={parts.some(toolRunning) ? 'running' : undefined}>
      {peers.length > 2 ? (
        <Menu
          items={peers.map((target) => ({
            label: target.peer.name,
            onSelect: () => openPair(target),
          }))}
        >
          <EventName icon={stack}>{m.rooms_pair_bots({ count: peers.length })}</EventName>
        </Menu>
      ) : peers.map((target, index) => (
        <Fragment key={target.peer.id}>
          {index > 0 && index === peers.length - 1 ? <EventLabel>{m.rooms_pair_and()}</EventLabel> : null}
          {index > 0 && index < peers.length - 1 ? <Text className="-ml-1.5">,</Text> : null}
          <ChatEventsLink onPress={target.conversationId === undefined ? undefined : () => openPair(target)}>
            <BotMention animate={target.conversationId === undefined && parts.some(toolRunning)} bot={target.peer} />
          </ChatEventsLink>
        </Fragment>
      ))}
    </ChatEventsLine>
  );
}

interface ChatEventsRoutineProps {
  event: ClientTypes.ToolEventRoutine;
  senderId: string;
  session: RpcSession;
}

function ChatEventsRoutine({ event, senderId, session }: ChatEventsRoutineProps) {
  const router = useRouter();
  const routines = useQuery(session.rpc.routines.list.queryOptions({ input: { botId: senderId } }));
  const isRemoved = event.action === 'remove';
  const isDeleted = !isRemoved && routines.isSuccess && routines.isFetchedAfterMount && !routines.data.some((routine) => routine.id === event.routine.id);

  const label = match(event.action)
    .with('create', () => m.rooms_event_routine_create())
    .with('update', () => m.rooms_event_routine_update())
    .with('run', () => m.rooms_event_routine_run())
    .with('remove', () => m.rooms_event_routine_remove())
    .exhaustive();

  return (
    <ChatEventsLine isDeleted={isDeleted} label={label}>
      <ChatEventsLink onPress={isRemoved || isDeleted ? undefined : () => router.push({ pathname: '/bots/[botId]/routines', params: { botId: senderId } })}>
        <EventName icon={<Icon icon={CHAT_EVENTS_ICONS[event.icon]} tone="subtle" />}>{event.routine.name}</EventName>
      </ChatEventsLink>
    </ChatEventsLine>
  );
}

interface ChatEventsTodoProps {
  event: ClientTypes.ToolEventTodo;
  senderId: string;
  session: RpcSession;
}

function ChatEventsTodo({ event, senderId, session }: ChatEventsTodoProps) {
  const router = useRouter();
  const todos = useQuery(session.rpc.todos.list.queryOptions({ input: { botId: senderId } }));
  const isRemoved = event.action === 'remove';
  const isDeleted = !isRemoved && todos.isSuccess && todos.isFetchedAfterMount && !todos.data.some((todo) => todo.id === event.todo.id);

  const label = match(event.action)
    .with('create', () => m.rooms_event_todo_create())
    .with('update', () => m.rooms_event_todo_update())
    .with('complete', () => m.rooms_event_todo_complete())
    .with('remove', () => m.rooms_event_todo_remove())
    .exhaustive();

  return (
    <ChatEventsLine isDeleted={isDeleted} label={label}>
      <ChatEventsLink onPress={isRemoved || isDeleted ? undefined : () => router.push({ pathname: '/bots/[botId]/todos', params: { botId: senderId } })}>
        <EventName icon={<Icon icon={CHAT_EVENTS_ICONS[event.icon]} tone="subtle" />}>{event.todo.title}</EventName>
      </ChatEventsLink>
    </ChatEventsLine>
  );
}

interface ChatEventsBotProps {
  event: ClientTypes.ToolEventBot;
  session: RpcSession;
}

function ChatEventsBot({ event, session }: ChatEventsBotProps) {
  const router = useRouter();
  const bots = useQuery(session.rpc.bots.list.queryOptions());
  const bot = bots.data?.find((item) => item.id === event.botId);
  const isDeleted = bots.isSuccess && bots.isFetchedAfterMount && !bot;
  const name = bot?.name ?? event.name;

  const label = match(event.action)
    .with('create', () => m.rooms_event_bot_create())
    .with('update', () => m.rooms_event_bot_update())
    .with('models', () => m.rooms_event_bot_models())
    .exhaustive();

  if (name === undefined) {
    return null;
  }

  return (
    <ChatEventsLine isDeleted={isDeleted} label={label}>
      <ChatEventsLink onPress={bot ? () => router.push({ pathname: '/chat/[botId]', params: { botId: bot.id } }) : undefined}>
        <BotMention bot={bot ?? { name }} />
      </ChatEventsLink>
    </ChatEventsLine>
  );
}

interface ChatEventsProps {
  events: ClientTypes.ToolEvent[];
  bots: Bot[];
  senderId: string;
  session: RpcSession;
}

export function ChatEvents({ events, bots, senderId, session }: ChatEventsProps) {
  return (
    <EventList>
      {events.map((event) => match(event)
        .with({ kind: 'peers' }, (peers) => (
          <ChatEventsPeers
            bots={bots}
            key={peers.key}
            parts={peers.parts}
            senderId={senderId}
          />
        ))
        .with({ kind: 'routine' }, (routine) => (
          <ChatEventsRoutine
            event={routine}
            key={routine.key}
            senderId={senderId}
            session={session}
          />
        ))
        .with({ kind: 'todo' }, (todo) => (
          <ChatEventsTodo
            event={todo}
            key={todo.key}
            senderId={senderId}
            session={session}
          />
        ))
        .with({ kind: 'bot' }, (bot) => (
          <ChatEventsBot
            event={bot}
            key={bot.key}
            session={session}
          />
        ))
        .exhaustive())}
    </EventList>
  );
}
