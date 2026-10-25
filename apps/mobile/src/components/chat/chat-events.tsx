import { toolPeers, toolRunning } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AlarmClock, ListTodo } from 'lucide-react-native';
import { Fragment } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { match } from 'ts-pattern';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Menu } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import type { RpcSession } from '@/types/rpc.types';
import type * as ClientTypes from '@repo/client/client';
import type { Bot } from '@repo/contracts/universal';
import type { ReactNode } from 'react';

interface ChatEventsLineProps {
  label: string;
  isDeleted?: boolean;
  children: ReactNode;
}

function ChatEventsLine({ label, isDeleted = false, children }: ChatEventsLineProps) {
  return (
    <View className="flex-row flex-wrap items-center justify-center gap-1 px-4 py-1.5">
      <Text variant="muted">{label}</Text>
      {children}
      {isDeleted ? <Text variant="muted">{m.rooms_event_deleted()}</Text> : null}
    </View>
  );
}

interface ChatEventsChipProps {
  icon: ReactNode;
  name: string;
  onPress?: () => void;
}

function ChatEventsChip({ icon, name, onPress }: ChatEventsChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'link' : undefined}
      className="flex-row items-center gap-1 rounded-full px-1.5 py-0.5 active:bg-accent"
      disabled={!onPress}
      onPress={onPress}
    >
      {icon}
      <Text variant="featured-name">{name}</Text>
    </Pressable>
  );
}

interface ChatEventsPeersProps {
  parts: ClientTypes.ToolPart[];
  bots: Bot[];
  senderId: string;
}

function ChatEventsPeers({ parts, bots, senderId }: ChatEventsPeersProps) {
  const router = useRouter();
  const peers = toolPeers(parts, bots);

  function openPair({ peer, conversationId }: ClientTypes.ToolPeer) {
    if (conversationId !== undefined) {
      router.push({ pathname: '/chat/[botId]/with/[peerId]', params: { botId: senderId, peerId: peer.id, conversationId } });
    }
  }

  return (
    <ChatEventsLine label={parts.length > 1 ? m.rooms_pair_messages({ count: parts.length }) : m.rooms_pair_messaged()}>
      {peers.length > 2 ? (
        <Menu
          items={peers.map((target) => ({
            label: target.peer.name,
            onSelect: () => openPair(target),
          }))}
        >
          <View className="flex-row items-center gap-1 rounded-full px-1.5 py-0.5">
            <View className="flex-row">
              {peers.slice(0, 3).map(({ peer }, index) => (
                <View className={index > 0 ? '-ml-1.5 rounded-full border-2 border-background' : 'rounded-full border-2 border-background'} key={peer.id}>
                  <Avatar
                    avatar={peer.avatar}
                    name={peer.name}
                    size="xs"
                  />
                </View>
              ))}
            </View>
            <Text variant="featured-name">{m.rooms_pair_bots({ count: peers.length })}</Text>
          </View>
        </Menu>
      ) : peers.map((target, index) => (
        <Fragment key={target.peer.id}>
          {index > 0 ? <Text variant="muted">{index === peers.length - 1 ? m.rooms_pair_and() : ','}</Text> : null}
          <ChatEventsChip
            icon={(
              <Avatar
                avatar={target.peer.avatar}
                name={target.peer.name}
                size="xs"
              />
            )}
            name={target.peer.name}
            onPress={target.conversationId === undefined ? undefined : () => openPair(target)}
          />
        </Fragment>
      ))}
      {parts.some(toolRunning) ? <ActivityIndicator size="small" /> : null}
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
      <ChatEventsChip
        icon={<Icon icon={AlarmClock} />}
        name={event.routine.name}
        onPress={isRemoved || isDeleted ? undefined : () => router.push({ pathname: '/bots/[botId]/routines', params: { botId: senderId } })}
      />
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
      <ChatEventsChip
        icon={<Icon icon={ListTodo} />}
        name={event.todo.title}
        onPress={isRemoved || isDeleted ? undefined : () => router.push({ pathname: '/bots/[botId]/todos', params: { botId: senderId } })}
      />
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
      <ChatEventsChip
        icon={(
          <Avatar
            avatar={bot?.avatar ?? null}
            name={name}
            size="xs"
          />
        )}
        name={name}
        onPress={bot ? () => router.push({ pathname: '/chat/[botId]', params: { botId: bot.id } }) : undefined}
      />
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
    <View className="py-0.5">
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
    </View>
  );
}
